"""
Food search and retrieval endpoints.
Handles unified search across local database and external APIs.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.food import Food
from app.schemas.food import FoodResponse, FoodSafetyStatus
from app.services.spoonacular_service import SpoonacularService
from app.services.pregnancy_safety_service import PregnancySafetyService, pregnancy_safety_service
from app.services.open_food_facts_service import open_food_facts_service
from app.services.allergen_service import check_allergens
from app.utils.food_factory import food_factory
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


def _is_valid_barcode(code: str) -> bool:
    """UPC-A (12), UPC-E (8), EAN-8 (8), EAN-13 (13), GTIN-14 (14)."""
    if not code or not code.isdigit():
        return False
    return len(code) in (8, 12, 13, 14)


@router.get("/barcode/{code}")
async def lookup_barcode(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Look up a packaged product by UPC/EAN barcode.

    Pipeline:
      1. Cache hit: return existing Food row keyed on off_id.
      2. Otherwise call Open Food Facts; if found, persist via
         food_factory.create_food_from_off (which also runs the
         pregnancy safety pipeline at ingest).
      3. Build a response carrying the Food fields plus the live
         safety_verdict + allergen_hits for this user.

    Returns 404 if the barcode is unknown to OFF.
    """
    if not _is_valid_barcode(code):
        raise HTTPException(status_code=400, detail="Invalid barcode format")

    food = db.query(Food).filter(Food.off_id == code).first()
    if not food:
        product = await open_food_facts_service.get_by_barcode(code)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        food = await food_factory.create_food_from_off(db, product)
        if not food:
            raise HTTPException(status_code=500, detail="Failed to persist barcode lookup")

    # Persisted ingest verdict is preferred when the user has no trimester
    # filter to apply; otherwise re-evaluate for trimester-specific rules.
    user_trimester = getattr(current_user, "trimester", None)
    if food.safety_verdict and not user_trimester:
        safety_verdict = food.safety_verdict
    else:
        safety_verdict = pregnancy_safety_service.evaluate(
            list(food.ingredients or [food.name]),
            food_category=food.category,
            trimester=user_trimester,
        )
    allergen_hits = check_allergens(food, current_user)

    return {
        "id": str(food.id),
        "name": food.name,
        "brand": food.brand,
        "description": food.description,
        "category": food.category,
        "serving_size": food.serving_size,
        "serving_unit": food.serving_unit,
        "calories": food.calories,
        "protein": food.protein,
        "carbs": food.carbs,
        "fat": food.fat,
        "fiber": food.fiber,
        "sugar": food.sugar,
        "micronutrients": food.micronutrients or {},
        "ingredients": food.ingredients or [],
        "allergens": food.allergens or [],
        "off_id": food.off_id,
        "source": food.source if isinstance(food.source, str) else food.source.value,
        "safety_status": food.safety_status,
        "safety_notes": food.safety_notes,
        "safety_verdict": safety_verdict,
        "allergen_hits": allergen_hits,
        "is_verified": food.is_verified,
        "item_type": "food",
    }


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
            # First check local database
            food = db.query(Food).filter(Food.id == food_id).first()
            
            if food:
                return food
            else:
                raise HTTPException(status_code=404, detail="Food not found")
        except Exception as e:
            logger.error(f"Error fetching food {food_id}: {e}")
            raise HTTPException(status_code=404, detail="Food not found")

