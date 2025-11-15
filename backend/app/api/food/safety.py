"""
Food safety checking endpoints.
Handles pregnancy safety analysis for foods and recipes.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...schemas.food import FoodSafetyStatus
from ...services.spoonacular_service import SpoonacularService
from ...services.usda_service import USDAService
from ...services.pregnancy_safety_service import PregnancySafetyService

# Request and Response Models
class IngredientSafetyResult(BaseModel):
    name: str
    safety_status: str
    safety_notes: str
    nutrients: Optional[Dict[str, Any]] = None

class FoodSafetyCheckRequest(BaseModel):
    query: str = Field(..., description="Food name, recipe text, or URL to check for safety")
    analyze_as_recipe: bool = Field(False, description="Set to True if the query is a recipe text or URL")

class FoodSafetyCheckResponse(BaseModel):
    query: str
    is_recipe: bool
    ingredients: List[IngredientSafetyResult]
    overall_safety_status: str
    safety_summary: str

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services
spoonacular_service = SpoonacularService()
usda_service = USDAService()
pregnancy_safety_service = PregnancySafetyService()

@router.post("/safety-check", response_model=FoodSafetyCheckResponse, tags=["Food Safety"])
async def check_food_safety(
    request: FoodSafetyCheckRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Check the safety of a food item or recipe for pregnancy.
    
    This endpoint uses Spoonacular to analyze the food/recipe and USDA database
    to check each ingredient for pregnancy safety.
    """
    try:
        if request.analyze_as_recipe:
            # Extract ingredients from recipe
            ingredients = await spoonacular_service.extract_ingredients_from_recipe(request.query)
            ingredient_names = [ingredient.get("name", "") for ingredient in ingredients]
        else:
            # Treat as a single food item
            ingredient_names = [request.query]
        
        # Check safety of each ingredient
        results = []
        safety_statuses = []
        
        # Use pregnancy safety service for comprehensive analysis
        overall_safety, overall_notes, ingredient_details = pregnancy_safety_service.check_food_safety(
            ingredients=ingredient_names
        )
        
        # Get nutrition info and enhance safety results
        for i, ingredient in enumerate(ingredient_names):
            nutrition = {}
            if not request.analyze_as_recipe:  # Only get nutrition for single items, not recipes
                try:
                    search_result = await spoonacular_service.classify_and_search(ingredient, 1)
                    if search_result["results"]:
                        food_data = search_result["results"][0]
                        food_id = food_data.get("id")
                        if food_id:
                            # Get nutrition based on classification
                            if search_result["type"] == "product":
                                nutrition_data = await spoonacular_service.get_product_information(food_id)
                            else:
                                nutrition_data = await spoonacular_service.get_food_information(food_id, amount=100, unit="g")
                            
                            nutrients = nutrition_data.get("nutrition", {}).get("nutrients", [])
                            
                            # Parse nutrients by name
                            nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
                            for nutrient in nutrients:
                                name = nutrient.get("name", "").lower()
                                amount = nutrient.get("amount", 0)
                                unit = nutrient.get("unit", "")
                                
                                if "calories" in name or "energy" in name:
                                    nutrition["calories"] = f"{amount} {unit}"
                                elif "protein" in name:
                                    nutrition["protein"] = f"{amount} {unit}"
                                elif "carbohydrates" in name or "carbs" in name:
                                    nutrition["carbs"] = f"{amount} {unit}"
                                elif "fat" in name and "saturated" not in name:
                                    nutrition["fat"] = f"{amount} {unit}"
                            
                            nutrition["serving_info"] = f"Per {nutrition_data.get('amount', 100)} {nutrition_data.get('unit', 'g')}"
                except Exception as e:
                    logger.warning(f"Could not get nutrition for {ingredient}: {e}")
            
            # Use pregnancy safety results
            ingredient_result = ingredient_details[i] if i < len(ingredient_details) else {
                "name": ingredient,
                "safety_status": "safe",
                "safety_notes": "Generally considered safe during pregnancy"
            }
            
            results.append({
                "name": ingredient_result["name"],
                "safety_status": ingredient_result["safety_status"],
                "safety_notes": ingredient_result["safety_notes"],
                "nutrients": nutrition if nutrition else None
            })
            
            # Track safety statuses for overall determination
            safety_status_enum = {
                "safe": FoodSafetyStatus.SAFE,
                "limited": FoodSafetyStatus.LIMITED,
                "avoid": FoodSafetyStatus.AVOID
            }.get(ingredient_result["safety_status"], FoodSafetyStatus.SAFE)
            safety_statuses.append(safety_status_enum)
        
        # Determine overall safety status
        if FoodSafetyStatus.AVOID in safety_statuses:
            overall_status = FoodSafetyStatus.AVOID
            summary = "This food contains ingredients that should be avoided during pregnancy."
        elif FoodSafetyStatus.LIMITED in safety_statuses:
            overall_status = FoodSafetyStatus.LIMITED
            summary = "This food contains ingredients that should be consumed in limited amounts during pregnancy."
        else:
            overall_status = FoodSafetyStatus.SAFE
            summary = "This food appears to be safe for pregnancy in normal amounts."
        
        return {
            "query": request.query,
            "is_recipe": request.analyze_as_recipe,
            "ingredients": results,
            "overall_safety_status": overall_status.value,
            "safety_summary": summary
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error checking food safety: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while checking food safety"
        )
