"""
Nutrition summary endpoints.
Handles daily nutrition calculations and summaries.
"""
import logging
from datetime import datetime, date as date_type
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...models.food import Food, FoodLog
from ...schemas.food import DailyNutrition

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/nutrition-summary", response_model=DailyNutrition)
async def get_nutrition_summary(
    date: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a summary of nutrition for a specific date.
    If no date is provided, use today's date.
    """
    # Parse date or use today (in UTC)
    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        # Use UTC date for consistency with stored timestamps
        filter_date = datetime.utcnow().date()
    
    logger.info(f"Fetching nutrition summary for user {current_user.id} on date {filter_date}")
    
    # Get food logs for the date (exclude soft-deleted)
    # Note: consumed_at is stored in UTC, so we compare against UTC date
    logs = (
        db.query(FoodLog)
        .join(Food, FoodLog.food_id == Food.id)
        .filter(
            FoodLog.user_id == current_user.id,
            FoodLog.deleted_at.is_(None),
            func.date(FoodLog.consumed_at) == filter_date
        )
        .all()
    )
    
    logger.info(f"Found {len(logs)} food logs for {filter_date}")
    
    # Calculate nutrition summary from logged nutrition data
    nutrition = DailyNutrition(date=filter_date)
    
    for log in logs:
        # Use the pre-calculated nutrition from the log
        nutrition.total_calories += log.calories_logged or 0.0
        
        # Add nutrients from the logged nutrients
        if log.nutrients_logged:
            nutrition.protein_g += log.nutrients_logged.get('protein', 0.0)
            nutrition.carbs_g += log.nutrients_logged.get('carbs', 0.0)
            nutrition.fat_g += log.nutrients_logged.get('fat', 0.0)
            nutrition.fiber_g += log.nutrients_logged.get('fiber', 0.0)
            nutrition.sugar_g += log.nutrients_logged.get('sugar', 0.0)
            nutrition.sodium_mg += log.nutrients_logged.get('sodium', 0.0)
            nutrition.calcium_mg += log.nutrients_logged.get('calcium', 0.0)
            nutrition.iron_mg += log.nutrients_logged.get('iron', 0.0)
            nutrition.vitamin_a_mcg += log.nutrients_logged.get('vitamin_a', 0.0)
            nutrition.vitamin_c_mg += log.nutrients_logged.get('vitamin_c', 0.0)
            nutrition.vitamin_d_mcg += log.nutrients_logged.get('vitamin_d', 0.0)
            nutrition.folate_mcg += log.nutrients_logged.get('folate', 0.0)
    
    logger.info(f"Nutrition summary for {filter_date}: {nutrition.total_calories} calories from {len(logs)} logs")
    return nutrition
