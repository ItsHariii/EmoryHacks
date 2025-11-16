"""
External API search coordination for food search.
Handles Spoonacular and USDA API calls and result processing.
"""
import logging
from sqlalchemy.orm import Session
from typing import List, Tuple

from ....services.spoonacular_service import SpoonacularService
from ....services.usda_service import USDAService
from ....schemas.food import FoodSearchResult
from .cache_manager import cache_usda_ingredients, cache_usda_foods, cache_spoonacular_results

logger = logging.getLogger(__name__)

# Initialize services
spoonacular_service = SpoonacularService()
usda_service = USDAService()

async def search_external_apis(
    query: str, 
    existing_results: List[FoodSearchResult], 
    db: Session,
    max_results: int = 10
) -> List[FoodSearchResult]:
    """
    Search external APIs for additional results.
    Uses only USDA API (Spoonacular disabled due to credit limits).
    Returns list of new FoodSearchResult objects.
    """
    new_results = []
    results_needed = max_results - len(existing_results)
    
    if results_needed <= 0:
        return new_results
    
    try:
        logger.info(f"Searching USDA API for '{query}' (need {results_needed} more results)")
        
        # Search USDA directly (Spoonacular disabled)
        usda_foods = await usda_service.search_foods(query, max_results)
        logger.info(f"USDA search returned {len(usda_foods)} foods")
        
        # Try to cache as ingredients first
        usda_results = await cache_usda_ingredients(usda_foods, db, existing_results)
        new_results.extend(usda_results)
            
    except Exception as e:
        logger.error(f"Error searching USDA API: {e}")
    
    return new_results

async def _search_usda_ingredients(query: str, existing_results: List, db: Session) -> List[FoodSearchResult]:
    """Search USDA for ingredients as primary source."""
    try:
        logger.info(f"Trying USDA first for ingredient '{query}' (need {10-len(existing_results)} more results)")
        usda_foods = await usda_service.search_foods(query, 10)
        logger.info(f"USDA search returned {len(usda_foods)} foods")
        
        return await cache_usda_ingredients(usda_foods, db, existing_results)
    except Exception as e:
        logger.error(f"Error searching USDA for ingredients: {e}")
        return []

async def _search_usda_fallback(query: str, search_type: str, existing_results: List, db: Session) -> List[FoodSearchResult]:
    """Use USDA as fallback for additional results."""
    try:
        # Try to get classification if not done already
        is_ingredient = search_type == "ingredient"
        
        # Search USDA for both ingredients and products
        logger.info(f"Searching USDA for '{query}' as fallback (need {10-len(existing_results)} more results)")
        usda_foods = await usda_service.search_foods(query, 10)
        logger.info(f"USDA search returned {len(usda_foods)} foods")
        
        if is_ingredient:
            return await cache_usda_ingredients(usda_foods, db, existing_results)
        else:
            # Enable USDA fallback for products as well - store as foods
            logger.info(f"Using USDA fallback for product '{query}' - storing as food")
            return await cache_usda_foods(usda_foods, db, existing_results, query)
            
    except Exception as e:
        logger.error(f"Error in USDA fallback search: {e}")
        return []
