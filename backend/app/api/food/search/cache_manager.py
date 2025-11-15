"""
Cache manager for food search.
Handles caching and creation of external API results.
"""
import json
import logging
from sqlalchemy.orm import Session
from typing import List, Optional

from ....models.food import Food
from ....models.ingredient import Ingredient
from ....schemas.food import FoodSafetyStatus
from ....services.spoonacular_service import SpoonacularService
from ....services.usda_service import USDAService
from ....services.pregnancy_safety_service import PregnancySafetyService
from ....utils.food_factory import FoodFactory
from ..utils import (
    create_and_cache_food_or_ingredient,
    get_or_create_usda_ingredient,
    get_or_create_usda_food
)
from .result_builder import build_usda_ingredient_result, build_usda_food_result

logger = logging.getLogger(__name__)

# Initialize services
spoonacular_service = SpoonacularService()
usda_service = USDAService()
pregnancy_safety_service = PregnancySafetyService()
food_factory = FoodFactory()

async def cache_usda_ingredients(usda_foods: List[dict], db: Session, existing_results: List) -> List:
    """Cache USDA ingredients and return new results."""
    new_results = []
    
    for usda_food in usda_foods:
        # Skip if we already have this food
        food_name = usda_food.get("description", "")
        if any(f.name.lower() == food_name.lower() for f in existing_results):
            continue
        
        # Create and cache USDA ingredient
        try:
            fdc_id = usda_food.get("fdcId") or usda_food.get("fdc_id")
            if not fdc_id:
                logger.warning(f"USDA food missing fdcId/fdc_id: {usda_food}")
                continue
            
            logger.info(f"Processing USDA ingredient: {food_name} (FDC ID: {fdc_id})")
            new_ingredient = await get_or_create_usda_ingredient(db, str(fdc_id))
            
            if new_ingredient:
                logger.info(f"Successfully created USDA ingredient: {new_ingredient.name}")
                new_results.append(build_usda_ingredient_result(new_ingredient))
                
                if len(existing_results) + len(new_results) >= 10:
                    break
        except Exception as e:
            logger.error(f"Error caching USDA ingredient: {e}")
    
    return new_results

async def cache_usda_foods(usda_foods: List[dict], db: Session, existing_results: List, query: str) -> List:
    """Cache USDA foods and return new results."""
    new_results = []
    
    for usda_food in usda_foods[:5]:  # Limit to 5 results
        food_name = usda_food.get("description", "").lower()
        if not food_name or query.lower() not in food_name:
            continue
        
        # Create and cache USDA food (not ingredient)
        try:
            fdc_id = usda_food.get("fdcId") or usda_food.get("fdc_id")
            if not fdc_id:
                logger.warning(f"USDA food missing fdcId/fdc_id: {usda_food}")
                continue
            
            logger.info(f"Processing USDA food: {food_name} (FDC ID: {fdc_id})")
            new_food = await get_or_create_usda_food(db, str(fdc_id))
            
            if new_food:
                logger.info(f"Successfully created USDA food: {new_food.name}")
                new_results.append(build_usda_food_result(new_food))
                
                if len(existing_results) + len(new_results) >= 10:
                    break
        except Exception as e:
            logger.error(f"Error caching USDA food: {e}")
    
    return new_results

async def cache_spoonacular_results(spoonacular_foods: List[dict], search_type: str, db: Session, existing_results: List) -> List:
    """Cache Spoonacular results and return new results."""
    new_results = []
    
    for spoon_food in spoonacular_foods:
        # Skip if we already have this food
        food_name = spoon_food.get("title", "") or spoon_food.get("name", "")
        if any(f.name.lower() == food_name.lower() for f in existing_results):
            continue
        
        # Get detailed nutrition using unified fetcher
        food_id = spoon_food.get("id")
        nutrition_data = await spoonacular_service.fetch_nutrition(food_id, search_type)
        
        # Extract ingredient names for safety check
        ingredients = nutrition_data.get("nutrition", {}).get("ingredients", [])
        ingredient_names = [ing.get("name", "") for ing in ingredients] if ingredients else [spoon_food.get("title", "")]
        
        # Check pregnancy safety for ingredients
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
        usda_confidence = None
        
        # Create and cache appropriately based on classification
        try:
            if search_type == "ingredient":
                # Store as ingredient
                ingredient_name = nutrition_data.get("name", food_name)
                
                # Get safety status specifically for this ingredient
                ingredient_safety_info = pregnancy_safety_service.get_safety_status(ingredient_name)
                
                new_ingredient = await food_factory.create_ingredient_from_spoonacular(
                    db=db,
                    ingredient_name=ingredient_name,
                    spoonacular_data=nutrition_data
                )
                
                if new_ingredient:
                    from .result_builder import build_ingredient_result
                    new_results.append(build_ingredient_result(new_ingredient))
            else:
                # Store as food (product)
                new_food = await create_and_cache_food_or_ingredient(
                    db=db,
                    spoonacular_data=nutrition_data,
                    spoonacular_id=str(food_id),
                    safety_status=safety_status,
                    safety_notes=safety_notes.strip("; "),
                    usda_confidence=usda_confidence,
                    data_type=search_type
                )
                
                if new_food:
                    from .result_builder import build_food_result
                    new_results.append(build_food_result(new_food))
        except Exception as e:
            logger.error(f"Error caching food from Spoonacular: {e}")
    
    return new_results
