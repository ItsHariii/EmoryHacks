"""
Food utilities and helper functions.
Contains shared functionality for food operations.
"""
import json
import logging
from sqlalchemy.orm import Session
from typing import Optional

from ...core.database import get_db
from ...models.food import Food, FoodSource
from ...models.ingredient import Ingredient
from ...schemas.food import FoodSafetyStatus
from ...services.spoonacular_service import SpoonacularService
from ...services.usda_service import USDAService
from ...utils.food_factory import FoodFactory

logger = logging.getLogger(__name__)

# Initialize services
spoonacular_service = SpoonacularService()
usda_service = USDAService()
food_factory = FoodFactory()

async def create_and_cache_food_or_ingredient(
    db: Session,
    spoonacular_data: dict,
    spoonacular_id: str,
    safety_status: FoodSafetyStatus,
    safety_notes: str,
    usda_confidence: Optional[float] = None,
    data_type: str = "ingredient"
) -> Optional[Food]:
    """
    Create and cache a food item from Spoonacular data.
    Always populates: Name/Brand/Category, Macros, Micros, Safety status.
    """
    try:
        # Check if food already exists by spoonacular_id
        existing_food = db.query(Food).filter(
            Food.spoonacular_id == spoonacular_id
        ).first()
        
        if existing_food:
            return existing_food
        
        # Extract nutrition data
        nutrition = spoonacular_data.get("nutrition", {})
        nutrients = nutrition.get("nutrients", [])
        
        # Parse nutrients into structured format
        parsed_nutrients = food_factory.parse_spoonacular_nutrients(nutrients)
        
        # Extract main nutrition values from parsed nutrients
        calories = parsed_nutrients.get("calories", {}).get("amount", 0.0)
        protein = parsed_nutrients.get("protein", {}).get("amount", 0.0)
        carbs = parsed_nutrients.get("carbohydrates", {}).get("amount", 0.0)
        fat = parsed_nutrients.get("fat", {}).get("amount", 0.0)
        fiber = parsed_nutrients.get("fiber", {}).get("amount", 0.0)
        sugar = parsed_nutrients.get("sugar", {}).get("amount", 0.0)
        
        # Extract serving information with defaults
        servings_info = spoonacular_data.get("servings", {})
        serving_size = servings_info.get("number") or 1.0
        serving_unit = servings_info.get("unit") or "serving"
        
        # Ensure serving_size is not None or 0
        if not serving_size or serving_size <= 0:
            serving_size = 1.0
            
        # Ensure serving_unit is not empty
        if not serving_unit or serving_unit.strip() == "":
            serving_unit = "serving"
        
        # Create new food record
        new_food = Food(
            name=spoonacular_data.get("title", spoonacular_data.get("name", "")),
            brand=spoonacular_data.get("brand", ""),
            category=spoonacular_data.get("aisle", ""),
            serving_size=serving_size,
            serving_unit=serving_unit,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            fiber=fiber,
            sugar=sugar,
            micronutrients=parsed_nutrients,
            safety_status=safety_status,
            safety_notes=safety_notes,
            spoonacular_id=spoonacular_id,
            source=FoodSource.SPOONACULAR,
            is_verified=True,
            usda_confidence=usda_confidence
        )
        
        db.add(new_food)
        db.commit()
        db.refresh(new_food)
        
        return new_food
        
    except Exception as e:
        logger.error(f"Error creating food from Spoonacular data: {str(e)}")
        db.rollback()
        return None

async def get_or_create_usda_ingredient(db: Session, fdc_id: str) -> Optional[Ingredient]:
    """Get a USDA ingredient from our database or create it using the food factory."""
    # First check if we already have this ingredient in our database
    ingredient = db.query(Ingredient).filter(Ingredient.fdc_id == fdc_id).first()
    if ingredient:
        return ingredient
    
    # Use food factory to create USDA ingredient
    return await food_factory.create_ingredient_from_usda(db, fdc_id)

async def get_or_create_usda_food(db: Session, fdc_id: str) -> Optional[Food]:
    """Create a Food entry from USDA data for products."""
    food = db.query(Food).filter(Food.fdc_id == fdc_id).first()
    if food:
        return food
    
    # Use food factory to create USDA food
    return await food_factory.create_food_from_usda(db, fdc_id)

async def create_and_cache_food(
    db: Session,
    spoonacular_data: dict,
    spoonacular_id: str,
    safety_status: FoodSafetyStatus,
    safety_notes: str
) -> Optional[Food]:
    """
    Create and cache a food item from Spoonacular data.
    Wrapper around create_and_cache_food_or_ingredient for backward compatibility.
    """
    return await create_and_cache_food_or_ingredient(
        db=db,
        spoonacular_data=spoonacular_data,
        spoonacular_id=spoonacular_id,
        safety_status=safety_status,
        safety_notes=safety_notes,
        data_type="food"
    )
