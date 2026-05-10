"""
Food safety checking endpoints.
Handles pregnancy safety analysis for foods and recipes.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID as UUIDType

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.food import Food
from ...models.safety_report import SafetyReport
from ...models.user import User
from ...schemas.food import FoodSafetyStatus
from ...services.spoonacular_service import SpoonacularService
from ...services.usda_service import USDAService
from ...services.pregnancy_safety_service import PregnancySafetyService

# Max reports a single user can submit per hour. Keeps the queue clean
# without needing a separate rate-limiter wiring.
_REPORT_RATE_LIMIT_PER_HOUR = 5

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
                "name": ingredient_result.get("name", ingredient),
                "safety_status": ingredient_result.get("safety_status", "safe"),
                "safety_notes": ingredient_result.get("safety_notes", ""),
                "nutrients": nutrition if nutrition else None
            })

            # Track safety statuses for overall determination
            safety_status_enum = {
                "safe": FoodSafetyStatus.SAFE,
                "limited": FoodSafetyStatus.LIMITED,
                "avoid": FoodSafetyStatus.AVOID
            }.get(ingredient_result.get("safety_status", "safe"), FoodSafetyStatus.SAFE)
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


class SafetyReportCreate(BaseModel):
    food_id: Optional[UUIDType] = Field(
        None, description="UUID of the Food row this report is about (null for ad-hoc names)."
    )
    food_name: str = Field(..., min_length=1, max_length=255)
    reported_status: FoodSafetyStatus = Field(
        ..., description="The status currently shown by the app."
    )
    suggested_status: Optional[FoodSafetyStatus] = Field(
        None, description="What the user thinks the correct status should be."
    )
    reason: str = Field(..., min_length=5, max_length=2000)


class SafetyReportResponse(BaseModel):
    id: UUIDType
    food_id: Optional[UUIDType]
    food_name: str
    reported_status: FoodSafetyStatus
    suggested_status: Optional[FoodSafetyStatus]
    reason: str
    review_status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post(
    "/safety/report",
    response_model=SafetyReportResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Food Safety"],
)
async def report_incorrect_safety(
    body: SafetyReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a user-submitted "this classification is wrong" report.

    Stored in `safety_reports` for admin curation. Per-user hourly rate limit
    keeps the queue clean. Returns the persisted report on success.
    """
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = (
        db.query(func.count(SafetyReport.id))
        .filter(
            SafetyReport.user_id == current_user.id,
            SafetyReport.created_at >= one_hour_ago,
        )
        .scalar()
        or 0
    )
    if recent_count >= _REPORT_RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reports submitted in the last hour. Try again later.",
        )

    if body.food_id is not None:
        food = db.query(Food).filter(Food.id == body.food_id).first()
        if not food:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referenced food not found.",
            )

    report = SafetyReport(
        user_id=current_user.id,
        food_id=body.food_id,
        food_name=body.food_name.strip(),
        reported_status=body.reported_status.value,
        suggested_status=body.suggested_status.value if body.suggested_status else None,
        reason=body.reason.strip(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info(
        "Safety report submitted by user %s for food '%s' (%s → %s)",
        current_user.id, report.food_name, report.reported_status, report.suggested_status,
    )

    return SafetyReportResponse(
        id=report.id,
        food_id=report.food_id,
        food_name=report.food_name,
        reported_status=FoodSafetyStatus(report.reported_status),
        suggested_status=(
            FoodSafetyStatus(report.suggested_status) if report.suggested_status else None
        ),
        reason=report.reason,
        review_status=report.review_status,
        created_at=report.created_at,
    )
