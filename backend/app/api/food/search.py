"""
Food search and retrieval endpoints.
Handles unified search across local database and external APIs.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...models.food import Food
from ...schemas.food import FoodResponse, FoodSafetyStatus
from ...services.spoonacular_service import SpoonacularService
from ...services.pregnancy_safety_service import PregnancySafetyService
from .utils import get_or_create_usda_food, create_and_cache_food
from .search import router as search_router

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

# Include the modular search router
router.include_router(search_router)

# Initialize services
spoonacular_service = SpoonacularService()
pregnancy_safety_service = PregnancySafetyService()


@router.get("/{food_id}", response_model=FoodResponse)
async def get_food_by_id(
    food_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a food by ID. Handles both local database IDs and external API IDs.
    Implements caching: if food exists locally, return it. Otherwise fetch and cache.
    """
    # Case 1: Check if it's a Spoonacular ID (prefixed with 'spoon_')
    if food_id.startswith('spoon_'):
        spoonacular_id = food_id[6:]  # Remove 'spoon_' prefix
        
        # Check if we already have this food cached
        cached_food = db.query(Food).filter(Food.spoonacular_id == spoonacular_id).first()
        if cached_food:
            return cached_food
        
        # Fetch from Spoonacular + USDA and cache
        try:
            nutrition_data = await spoonacular_service.get_food_information(int(spoonacular_id))
            
            # Get safety data from USDA
            ingredients = nutrition_data.get("nutrition", {}).get("ingredients", [])
            ingredient_names = [ing.get("name", "") for ing in ingredients] if ingredients else [nutrition_data.get("title", "")]
            
            safety_status = FoodSafetyStatus.SAFE
            safety_notes = ""
            
            # Use pregnancy safety service for comprehensive safety analysis
            overall_safety, overall_notes, ingredient_details = pregnancy_safety_service.check_food_safety(
                ingredients=ingredient_names,
                spoonacular_data=nutrition_data
            )
            
            # Map to FoodSafetyStatus enum
            safety_status_map = {
                "safe": FoodSafetyStatus.SAFE,
                "limited": FoodSafetyStatus.LIMITED,
                "avoid": FoodSafetyStatus.AVOID
            }
            safety_status = safety_status_map.get(overall_safety, FoodSafetyStatus.SAFE)
            safety_notes = overall_notes
            
            # Cache the food
            new_food = await create_and_cache_food(
                db=db,
                spoonacular_data=nutrition_data,
                spoonacular_id=spoonacular_id,
                safety_status=safety_status,
                safety_notes=safety_notes.strip("; ")
            )
            
            if new_food:
                return new_food
            else:
                raise HTTPException(status_code=404, detail="Food not found")
                
        except Exception as e:
            logger.error(f"Error fetching Spoonacular food {spoonacular_id}: {e}")
            raise HTTPException(status_code=404, detail="Food not found")
    
    # Case 2: Check if it's a USDA ID (prefixed with 'usda_')
    elif food_id.startswith('usda_'):
        fdc_id = food_id[5:]  # Remove 'usda_' prefix
        food = await get_or_create_usda_food(db, fdc_id)
        if food:
            return food
        else:
            raise HTTPException(status_code=404, detail="Food not found")
    
    # Case 3: Regular UUID from our database
    else:
        try:
            food = db.query(Food).filter(Food.id == food_id).first()
            if food:
                return food
            else:
                raise HTTPException(status_code=404, detail="Food not found")
        except Exception as e:
            logger.error(f"Error fetching food {food_id}: {e}")
            raise HTTPException(status_code=404, detail="Food not found")
