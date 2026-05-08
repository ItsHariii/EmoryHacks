"""External API search coordination for food search.

Order: local cache → Spoonacular (classify-and-search) → USDA fallback.
Spoonacular is the primary external source; USDA backfills when Spoonacular
returns nothing or rate-limits us.
"""
import logging
from sqlalchemy.orm import Session
from typing import List

from ....services.spoonacular_service import SpoonacularService
from ....services.usda_service import USDAService
from ....schemas.food import FoodSearchResult
from .cache_manager import cache_usda_ingredients, cache_usda_foods, cache_spoonacular_results

logger = logging.getLogger(__name__)

spoonacular_service = SpoonacularService()
usda_service = USDAService()


async def search_external_apis(
    query: str,
    existing_results: List[FoodSearchResult],
    db: Session,
    max_results: int = 10,
) -> List[FoodSearchResult]:
    """Run external lookups until we have max_results, or sources are exhausted."""
    new_results: List[FoodSearchResult] = []
    needed = max_results - len(existing_results)
    if needed <= 0:
        return new_results

    search_type = "ingredient"
    try:
        spoon_payload = await spoonacular_service.classify_and_search(query, needed)
        search_type = spoon_payload.get("type", "ingredient")
        spoon_foods = spoon_payload.get("results", []) or []

        if spoon_foods:
            cached = await cache_spoonacular_results(
                spoon_foods, search_type, db, existing_results + new_results
            )
            new_results.extend(cached)
            logger.info(
                "Spoonacular returned %d results for '%s' (type=%s)",
                len(cached), query, search_type,
            )
    except Exception as e:
        logger.error("Spoonacular search failed for '%s': %s", query, e)

    needed = max_results - len(existing_results) - len(new_results)
    if needed <= 0:
        return new_results

    try:
        usda_foods = await usda_service.search_foods(query, needed)
        logger.info("USDA fallback returned %d foods for '%s'", len(usda_foods), query)

        seen = existing_results + new_results
        if search_type == "ingredient":
            usda_results = await cache_usda_ingredients(usda_foods, db, seen)
        else:
            usda_results = await cache_usda_foods(usda_foods, db, seen, query)
        new_results.extend(usda_results)
    except Exception as e:
        logger.error("USDA fallback failed for '%s': %s", query, e)

    return new_results
