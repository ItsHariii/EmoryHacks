"""
USDA FoodData Central API service for food and ingredient data retrieval.

This service handles all interactions with the USDA FoodData Central API,
including searching for foods and retrieving detailed nutrition information.
"""

import httpx
import logging
from typing import List, Dict, Any, Optional, Tuple
from ..core.config import settings
from ..models.food import FoodSafetyStatus
from .pregnancy_safety_service import pregnancy_safety_service
from .rate_limiter import usda_client

logger = logging.getLogger(__name__)

# USDA FoodData Central API configuration
USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Standardized dataType filter list used by all USDA queries
USDA_DATA_TYPES = ["Survey (FNDDS)", "Branded", "Foundation"]


class USDAService:
    """Service for interacting with USDA FoodData Central API."""
    
    def __init__(self):
        self.api_key = settings.USDA_API_KEY
        self.base_url = USDA_API_BASE_URL
    
    async def search_foods(self, query: str, page_size: int = 10) -> List[Dict[str, Any]]:
        """
        Search for foods in the USDA FoodData Central API.
        
        Args:
            query: Search term for foods
            page_size: Number of results to return (max 200)
            
        Returns:
            List of food items from USDA database
        """
        if not self.api_key:
            logger.warning("USDA_API_KEY not configured")
            return []
        
        url = f"{self.base_url}/foods/search"
        params = {
            "api_key": self.api_key,
            "query": query,
            "pageSize": min(page_size, 200),  # USDA API limit
            "dataType": USDA_DATA_TYPES,
        }

        try:
            response = await usda_client.get(url, params=params)
            data = response.json()
            foods = data.get("foods", [])
            logger.info(f"USDA search for '{query}' returned {len(foods)} results")
            return foods

        except httpx.HTTPStatusError as e:
            logger.error(f"USDA API HTTP error for query '{query}': {e}")
        except httpx.RequestError as e:
            logger.error(f"USDA API request error for query '{query}': {e}")
        except Exception as e:
            logger.error(f"Unexpected error searching USDA for '{query}': {e}")

        return []
    
    async def get_food_details(self, fdc_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information for a specific USDA food item by FDC ID.
        
        Args:
            fdc_id: USDA Food Data Central ID
            
        Returns:
            Detailed food information including nutrients, or None if not found
        """
        if not self.api_key:
            logger.warning("USDA_API_KEY not configured")
            return None
            
        url = f"{self.base_url}/food/{fdc_id}"
        params = {"api_key": self.api_key}

        try:
            response = await usda_client.get(url, params=params)
            data = response.json()
            logger.info(
                f"USDA API returned data for food FDC ID {fdc_id}: "
                f"{data.get('description', 'Unknown')}"
            )
            return data

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"USDA food not found for FDC ID {fdc_id}")
            else:
                logger.error(f"USDA API HTTP error for FDC ID {fdc_id}: {e}")
        except httpx.RequestError as e:
            logger.error(f"USDA API request error for FDC ID {fdc_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching USDA food {fdc_id}: {e}")

        return None
    
    def parse_nutrients(self, usda_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse USDA nutrient data into a standardized format.
        Captures ALL nutrients from USDA, not just macros.
        
        Args:
            usda_data: Raw USDA food data
            
        Returns:
            Parsed nutrient data with standardized keys
        """
        nutrients = {}
        food_nutrients = usda_data.get("foodNutrients", [])
        
        # Map USDA nutrient IDs to our standard names for key nutrients
        # This helps with consistent naming across the app
        nutrient_id_mapping = {
            1008: "calories",      # Energy
            1003: "protein",       # Protein
            1005: "carbs",         # Carbohydrate, by difference
            1004: "fat",           # Total lipid (fat)
            1079: "fiber",         # Fiber, total dietary
            2000: "sugar",         # Sugars, total including NLEA
            1093: "sodium",        # Sodium, Na
            1087: "calcium",       # Calcium, Ca
            1089: "iron",          # Iron, Fe
            1090: "magnesium",     # Magnesium, Mg
            1095: "zinc",          # Zinc, Zn
            1092: "potassium",     # Potassium, K
            1106: "vitamin_a",     # Vitamin A, RAE
            1162: "vitamin_c",     # Vitamin C, total ascorbic acid
            1114: "vitamin_d",     # Vitamin D (D2 + D3)
            1109: "vitamin_e",     # Vitamin E (alpha-tocopherol)
            1185: "folate",        # Folate, total
            1165: "thiamin",       # Thiamin
            1166: "riboflavin",    # Riboflavin
            1167: "niacin",        # Niacin
            1175: "vitamin_b6",    # Vitamin B-6
            1178: "vitamin_b12",   # Vitamin B-12
            1253: "cholesterol",   # Cholesterol
            1258: "saturated_fat", # Fatty acids, total saturated
            1257: "trans_fat",     # Fatty acids, total trans
            1057: "caffeine",      # Caffeine
            1018: "alcohol",       # Alcohol, ethyl
            1009: "starch",        # Starch
            1010: "sucrose",       # Sucrose
            1011: "glucose",       # Glucose
            1012: "fructose",      # Fructose
            1013: "lactose",       # Lactose
            1014: "maltose",       # Maltose
            1051: "water",         # Water
        }
        
        # Process ALL nutrients from USDA
        for nutrient in food_nutrients:
            nutrient_info = nutrient.get("nutrient", {})
            nutrient_id = nutrient_info.get("id")
            nutrient_name = nutrient_info.get("name", "").lower()
            amount = nutrient.get("amount", 0)
            unit = nutrient_info.get("unitName", "")
            
            # Skip if no name or amount is None
            if not nutrient_name or amount is None:
                continue
            
            # Use mapped name if available, otherwise use cleaned name
            if nutrient_id in nutrient_id_mapping:
                key = nutrient_id_mapping[nutrient_id]
            else:
                # Clean up the name for use as a key
                key = nutrient_name.replace(" ", "_").replace(",", "").replace("(", "").replace(")", "")
            
            nutrients[key] = {
                "amount": amount,
                "unit": unit,
                "percent_daily_value": nutrient.get("percentDailyValue")
            }
        
        return nutrients
    
    def extract_basic_info(self, usda_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract basic food information from USDA data.
        
        Args:
            usda_data: Raw USDA food data
            
        Returns:
            Basic food information (name, brand, ingredients, etc.)
        """
        description = usda_data.get("description", "").strip()
        brand = usda_data.get("brandOwner", "").strip() or usda_data.get("brandName", "").strip()
        
        # Extract ingredients if available
        ingredients = []
        ingredients_text = usda_data.get("ingredients", "")
        if ingredients_text:
            # Split ingredients by common delimiters
            ingredients = [
                ingredient.strip() 
                for ingredient in ingredients_text.replace(",", "\n").replace(";", "\n").split("\n")
                if ingredient.strip()
            ]
        
        return {
            "name": description,
            "brand": brand or None,
            "description": ingredients_text,
            "ingredients": ingredients,
            "category": usda_data.get("foodCategory", {}).get("description"),
            "serving_size": 100,  # USDA data is typically per 100g
            "serving_unit": "g"
        }

    def analyze_food_safety(
        self, ingredient_name: str, food_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[FoodSafetyStatus, str]:
        """Pregnancy safety verdict for a USDA food.

        Order: JSON-rule lookup via pregnancy_safety_service first; fall back
        to a keyword scan over the USDA description/ingredients only when the
        JSON rules return the default (limited/unreviewed) verdict.
        """
        rule = pregnancy_safety_service.get_safety_status(ingredient_name)
        rule_status = rule.get("status", "limited")
        rule_notes = rule.get("notes", "")

        if rule_status in {"safe", "avoid"}:
            return FoodSafetyStatus(rule_status), rule_notes

        if not food_data:
            return FoodSafetyStatus(rule_status), rule_notes

        description = (food_data.get("description") or "").lower()
        ingredients_text = (food_data.get("ingredients") or "").lower()

        raw_terms = ["raw", "unpasteurized", "undercooked", "rare", "runny", "sushi"]
        if any(term in description or term in ingredients_text for term in raw_terms):
            return (
                FoodSafetyStatus.AVOID,
                f"{ingredient_name} appears to contain raw or unpasteurized "
                "ingredients which should be avoided during pregnancy.",
            )

        high_mercury_fish = [
            "swordfish", "shark", "tilefish", "king mackerel", "bigeye tuna",
        ]
        if any(fish in description for fish in high_mercury_fish):
            return (
                FoodSafetyStatus.AVOID,
                f"{ingredient_name} is a high-mercury fish which should be "
                "avoided during pregnancy.",
            )

        soft_cheeses = ["brie", "camembert", "blue cheese", "feta", "queso fresco"]
        if any(cheese in description for cheese in soft_cheeses) and "cheese" in description:
            return (
                FoodSafetyStatus.LIMITED,
                f"{ingredient_name} is a soft cheese. Confirm pasteurization "
                "before consuming during pregnancy.",
            )

        return FoodSafetyStatus(rule_status), rule_notes


# Create singleton instance
usda_service = USDAService()
