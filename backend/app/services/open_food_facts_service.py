"""Open Food Facts (OFF) API service.

Mirrors the shape of `usda_service` so the search orchestrator can fan out
to OFF in parallel without bespoke handling. OFF requires no API key but
asks clients to honor a polite ≤1 req/sec rate; that's enforced by the
shared `off_client` (`open_food_facts` entry in EXTERNAL_RATE_LIMITS).

Key endpoints used:
  - GET /api/v2/search?search_terms=… — text search
  - GET /api/v2/product/<barcode>.json — barcode lookup

The search response uses `products` (v2) instead of v0's `product`. We
normalize both calls to return dict payloads compatible with our
food_factory parser (`parse_nutrients` / `extract_basic_info`).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from .rate_limiter import off_client

logger = logging.getLogger(__name__)

OFF_BASE_URL = "https://world.openfoodfacts.org/api/v2"

# OFF nutriment keys → our canonical micronutrient keys. Values come on
# *_100g (per 100g) in the OFF payload.
_OFF_NUTRIENT_MAP: Dict[str, str] = {
    "energy-kcal_100g": "calories",
    "proteins_100g": "protein",
    "carbohydrates_100g": "carbs",
    "fat_100g": "fat",
    "fiber_100g": "fiber",
    "sugars_100g": "sugar",
    "sodium_100g": "sodium",
    "calcium_100g": "calcium",
    "iron_100g": "iron",
    "magnesium_100g": "magnesium",
    "zinc_100g": "zinc",
    "potassium_100g": "potassium",
    "vitamin-a_100g": "vitamin_a",
    "vitamin-c_100g": "vitamin_c",
    "vitamin-d_100g": "vitamin_d",
    "vitamin-e_100g": "vitamin_e",
    "folate_100g": "folate",
    "vitamin-b6_100g": "vitamin_b6",
    "vitamin-b12_100g": "vitamin_b12",
    "cholesterol_100g": "cholesterol",
    "saturated-fat_100g": "saturated_fat",
    "trans-fat_100g": "trans_fat",
    "caffeine_100g": "caffeine",
    "alcohol_100g": "alcohol",
    "choline_100g": "choline",
    "omega-3-fat_100g": "omega3",
    "docosahexaenoic-acid_100g": "dha",
}


class OpenFoodFactsService:
    """Service for interacting with the Open Food Facts API."""

    def __init__(self) -> None:
        self.base_url = OFF_BASE_URL

    async def search_foods(self, query: str, page_size: int = 10) -> List[Dict[str, Any]]:
        """Free-text product search.

        OFF v2 query string supports `search_terms` + `fields` for projection.
        """
        if not query or not query.strip():
            return []

        url = f"{self.base_url}/search"
        params = {
            "search_terms": query.strip(),
            "page_size": min(max(page_size, 1), 100),
            "fields": (
                "code,product_name,brands,categories,categories_tags,"
                "ingredients_text,allergens_tags,nutriments,serving_size,"
                "serving_quantity,nutriscore_grade"
            ),
            "json": 1,
        }

        try:
            response = await off_client.get(url, params=params)
            data = response.json()
            products = data.get("products", []) or []
            logger.info("OFF search '%s' returned %d products", query, len(products))
            return products
        except httpx.HTTPStatusError as e:
            logger.error("OFF HTTP error for '%s': %s", query, e)
        except httpx.RequestError as e:
            logger.error("OFF request error for '%s': %s", query, e)
        except Exception as e:
            logger.error("Unexpected error searching OFF for '%s': %s", query, e)

        return []

    async def get_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """Fetch a single product by its UPC/EAN barcode.

        Returns the full product dict on success, or None on miss / error.
        OFF responds 200 with `status: 0` when the product is unknown.
        """
        code = (barcode or "").strip()
        if not code:
            return None

        url = f"{self.base_url}/product/{code}.json"
        try:
            response = await off_client.get(url)
            data = response.json()
            if data.get("status") != 1:
                logger.info("OFF barcode %s not found", code)
                return None
            return data.get("product")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.info("OFF barcode %s not found (404)", code)
                return None
            logger.error("OFF barcode HTTP error for %s: %s", code, e)
        except httpx.RequestError as e:
            logger.error("OFF barcode request error for %s: %s", code, e)
        except Exception as e:
            logger.error("Unexpected error fetching OFF barcode %s: %s", code, e)

        return None

    def parse_nutrients(self, product: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Convert OFF `nutriments` dict to our canonical structured form.

        Output shape matches `usda_service.parse_nutrients`:
            {key: {"amount": float, "unit": str, "percent_daily_value": None}}

        Per-100g values are preserved; the consumer (FoodFactory) tags
        serving_size=100g/serving_unit="g" so downstream calculations stay
        consistent with the rest of the catalog.
        """
        nutriments = product.get("nutriments", {}) or {}
        parsed: Dict[str, Dict[str, Any]] = {}

        for off_key, canonical in _OFF_NUTRIENT_MAP.items():
            amount = nutriments.get(off_key)
            if amount is None:
                continue
            try:
                amount_f = float(amount)
            except (TypeError, ValueError):
                continue
            unit_key = off_key.replace("_100g", "_unit")
            unit = nutriments.get(unit_key) or ("kcal" if canonical == "calories" else "g")
            parsed[canonical] = {
                "amount": amount_f,
                "unit": str(unit),
                "percent_daily_value": None,
            }

        # Calories fallback: OFF sometimes omits energy-kcal but includes
        # energy_100g (kJ). Convert if needed.
        if "calories" not in parsed:
            energy_kj = nutriments.get("energy_100g") or nutriments.get("energy-kj_100g")
            if energy_kj is not None:
                try:
                    parsed["calories"] = {
                        "amount": float(energy_kj) / 4.184,
                        "unit": "kcal",
                        "percent_daily_value": None,
                    }
                except (TypeError, ValueError):
                    pass

        return parsed

    def extract_basic_info(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Extract name/brand/category/ingredients/allergens/serving info."""
        name = (product.get("product_name") or "").strip() or "Unknown Product"
        brand = (product.get("brands") or "").split(",")[0].strip() or None

        category = product.get("categories") or ""
        category = category.split(",")[0].strip() if category else None

        ingredients_text = (product.get("ingredients_text") or "").strip()
        ingredients: List[str] = []
        if ingredients_text:
            for token in ingredients_text.replace(";", ",").split(","):
                clean = token.strip(" .*").strip()
                if clean:
                    ingredients.append(clean)

        allergens: List[str] = []
        for tag in product.get("allergens_tags", []) or []:
            # OFF allergens come as "en:milk", "en:eggs". Strip the language prefix.
            label = str(tag)
            if ":" in label:
                label = label.split(":", 1)[1]
            label = label.replace("-", " ").strip()
            if label:
                allergens.append(label)

        serving_quantity = product.get("serving_quantity")
        try:
            serving_size = float(serving_quantity) if serving_quantity else 100.0
        except (TypeError, ValueError):
            serving_size = 100.0

        return {
            "name": name,
            "brand": brand,
            "description": ingredients_text,
            "category": category,
            "ingredients": ingredients,
            "allergens": allergens,
            "serving_size": serving_size,
            "serving_unit": "g",
            "barcode": str(product.get("code", "")).strip() or None,
            "nutriscore_grade": product.get("nutriscore_grade"),
        }


# Module-level singleton (pattern matches usda_service / spoonacular_service).
open_food_facts_service = OpenFoodFactsService()
