"""
Modular food search functionality.
Main search endpoint that orchestrates database and external API searches.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....schemas.food import FoodSearchResult
from .database import search_local_database
from .result_builder import build_search_results
from .external_apis import search_external_apis

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/search", response_model=List[FoodSearchResult])
async def search_foods(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified search for both foods and ingredients with complete nutrition data:
    1. Search local database (both foods and ingredients tables)
    2. Query external APIs for missing items
    3. Cache results appropriately based on classification
    """
    try:
        # Step 1: Search local database
        foods, ingredients = search_local_database(query, db)
        results = build_search_results(foods, ingredients)
        
        # Step 2: Search external APIs if we need more results
        if len(results) < 10:
            external_results = await search_external_apis(query, results, db)
            results.extend(external_results)
        
        logger.info(f"Returning {len(results)} total search results for '{query}'")
        return results
        
    except Exception as e:
        logger.error(f"Error in food search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during food search"
        )
