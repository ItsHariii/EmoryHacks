"""
Nutrition summary endpoints.
Handles daily nutrition calculations and summaries.
"""
import logging
from datetime import datetime, date as date_type
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    # Parse date or use today
    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        filter_date = date_type.today()
    
    # Get food logs for the date
    logs = (
        db.query(FoodLog)
        .join(Food, FoodLog.food_id == Food.id)
        .filter(
            FoodLog.user_id == current_user.id,
            db.func.date(FoodLog.consumed_at) == filter_date
        )
        .all()
    )
    
    # Calculate nutrition summary
    nutrition = DailyNutrition(date=filter_date)
    
    for log in logs:
        nutrition.add_food(log.food, log.quantity)
    
    return nutrition
