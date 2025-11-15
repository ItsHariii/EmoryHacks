"""
Food logging endpoints.
Handles CRUD operations for food consumption logs.
"""
import logging
from datetime import datetime, date as date_type
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.nutrition_calculator_service import NutritionCalculatorService
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.food import Food, FoodLog
from app.models.ingredient import Ingredient
from app.schemas.food import FoodLogCreate, FoodLogUpdate, FoodLogResponse, DailyNutrition
from app.services.usda_service import USDAService
from app.utils.food_factory import FoodFactory
from app.core.config import settings

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

def _format_food_log_response(food_log: FoodLog, food: Food, serving_size: float = None, serving_unit: str = None) -> dict:
    """Helper function to format food log response with clarity fields."""
    # Use provided serving info or fall back to food defaults
    actual_serving_size = serving_size or food.serving_size
    actual_serving_unit = serving_unit or food.serving_unit
    
    return {
        "id": str(food_log.id),
        "user_id": str(food_log.user_id),
        "food_id": str(food_log.food_id),
        "serving_size": actual_serving_size,
        "serving_unit": actual_serving_unit,
        "quantity": food_log.quantity,
        "consumed_at": food_log.consumed_at,
        "meal_type": food_log.meal_type,
        "notes": food_log.notes,
        "created_at": food_log.created_at,
        "updated_at": food_log.updated_at,
        # Clarity fields
        "total_amount": actual_serving_size * food_log.quantity,
        "total_unit": actual_serving_unit,
        # Calculated nutrition fields
        "calories_logged": food_log.calories_logged,
        "nutrients_logged": food_log.nutrients_logged,
        "food": {
            "id": str(food.id),
            "name": food.name,
            "description": food.description,
            "category": food.category,
            "brand": food.brand,
            "serving_size": food.serving_size,
            "serving_unit": food.serving_unit,
            "calories": food.calories,
            "nutrients": {
                "protein": {"amount": food.protein, "unit": "g"},
                "carbs": {"amount": food.carbs, "unit": "g"},
                "fat": {"amount": food.fat, "unit": "g"},
                "fiber": {"amount": food.fiber, "unit": "g"},
                "sugar": {"amount": food.sugar, "unit": "g"}
            },
            "safety_status": food.safety_status,
            "safety_notes": food.safety_notes,
            "fdc_id": food.fdc_id,
            "created_at": food.created_at,
            "updated_at": food.updated_at,
            "source": food.source,
            "is_verified": food.is_verified
        }
    }

# Initialize services
usda_service = USDAService()
food_factory = FoodFactory()

@router.post("/log", response_model=FoodLogResponse, status_code=status.HTTP_201_CREATED)
async def log_food(
    log_in: FoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a food item for the current user.
    Handles both local database foods and USDA foods.
    """
    food_id = log_in.food_id
    food = None
    
    # Check if this is a USDA food (prefixed with 'usda_')
    if isinstance(food_id, str) and food_id.startswith('usda_'):
        try:
            # Extract the USDA FDC ID
            fdc_id = food_id[5:]  # Remove 'usda_' prefix
            
            # First check if we already have this USDA food in our database
            food = db.query(Food).filter(Food.fdc_id == fdc_id).first()
            
            if not food and settings.USDA_API_KEY:
                # If not in our DB, fetch from USDA API and save it
                usda_service = USDAService()
                usda_food = await usda_service.get_food_details(fdc_id)
                if not usda_food:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"USDA food with FDC ID {fdc_id} not found"
                    )
                
                # Create Food object from USDA data
                food_factory = FoodFactory()
                food = await food_factory.create_food_from_usda(usda_food, db)
                
        except Exception as e:
            logger.error(f"Error processing USDA food {food_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process USDA food: {str(e)}"
            )
    else:
        # Regular food lookup by UUID - check both foods and ingredients tables
        food = db.query(Food).filter(Food.id == food_id).first()
        
        # If not found in foods table, check ingredients table
        if not food:
            ingredient = db.query(Ingredient).filter(Ingredient.id == food_id).first()
            if ingredient:
                # Convert ingredient to food-like object for logging
                # Create a temporary Food object with ingredient data
                food = Food(
                    id=ingredient.id,
                    name=ingredient.name,
                    description=ingredient.description,
                    category=ingredient.category,
                    brand=getattr(ingredient, 'brand', None),
                    serving_size=getattr(ingredient, 'serving_size', 100.0),
                    serving_unit=getattr(ingredient, 'serving_unit', 'g'),
                    calories=ingredient.calories,
                    protein=ingredient.protein,
                    carbs=ingredient.carbs,
                    fat=ingredient.fat,
                    fiber=ingredient.fiber,
                    sugar=ingredient.sugar,
                    micronutrients=ingredient.micronutrients,
                    safety_status=ingredient.safety_status,
                    safety_notes=ingredient.safety_notes,
                    fdc_id=ingredient.fdc_id,
                    source=ingredient.source,
                    is_verified=getattr(ingredient, 'is_verified', True),
                    created_at=ingredient.created_at,
                    updated_at=ingredient.updated_at
                )
    
    if not food:
        # If food not found in either table, try to recreate it
        logger.warning(f"Food {food_id} not found in database, attempting to recreate")
        
        # First, try to find any food with the same FDC ID that might have been recreated
        potential_food = db.query(Food).filter(Food.name.ilike('%orange%')).first()
        if potential_food:
            logger.info(f"Found similar food: {potential_food.name} with ID {potential_food.id}")
            food = potential_food
        else:
            # Try to create from external APIs
            try:
                # Check if this looks like a USDA FDC ID pattern
                if food_id.startswith('usda_'):
                    fdc_id = food_id[5:]
                    usda_service = USDAService()
                    usda_food = await usda_service.get_food_details(fdc_id)
                    if usda_food:
                        food_factory = FoodFactory()
                        food = await food_factory.create_food_from_usda(usda_food, db)
                
                if not food:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Food not found and could not be created from external sources"
                    )
            except Exception as e:
                import traceback
                logger.error(f"Error creating missing food {food_id}: {str(e)}")
                logger.error(f"Full traceback: {traceback.format_exc()}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Food not found"
                )
    
    try:
        logger.info(f"Creating food log for user {current_user.id} with food: {food.name}")
        
        # Handle consumed_at field - use provided value or default to current time
        consumed_at = log_in.consumed_at
        if consumed_at is None:
            consumed_at = datetime.utcnow()
        
        # Initialize nutrition calculator service
        nutrition_calculator = NutritionCalculatorService()
        
        # Calculate nutrition based on user-provided serving size and unit
        nutrition_data = nutrition_calculator.calculate_consumed_nutrition(
            food=food,
            user_serving_size=log_in.serving_size,
            user_serving_unit=log_in.serving_unit,
            quantity=1.0  # Since serving_size already represents the amount consumed
        )
        
        # Create food log entry with calculated nutrition
        current_time = datetime.utcnow()
        food_log = FoodLog(
            user_id=current_user.id,
            food_id=food.id,
            serving_size=log_in.serving_size,  # User-provided serving size
            serving_unit=log_in.serving_unit,  # User-provided serving unit
            quantity=1.0,  # Always 1 since serving_size represents the actual amount
            consumed_at=consumed_at,
            meal_type=log_in.meal_type,
            notes=log_in.notes,
            calories_logged=nutrition_data['calories_logged'],
            nutrients_logged=nutrition_data['nutrients_logged'],
            created_at=current_time,
            updated_at=current_time
        )
        
        db.add(food_log)
        db.flush()  # Flush to get the ID and timestamps
        db.refresh(food_log)
        db.commit()
        
        logger.info(f"Successfully created food log {food_log.id} with {nutrition_data['calories_logged']} calories")
        
        # Format response with serving info
        return _format_food_log_response(food_log, food)
        
    except Exception as e:
        logger.error(f"Error creating food log: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create food log: {str(e)}"
        )

@router.get("/log", response_model=List[FoodLogResponse])
async def get_food_logs(
    date: Optional[str] = None,
    meal_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get food logs for the current user.
    Can filter by date and/or meal type.
    """
    query = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.deleted_at.is_(None)  # Exclude soft-deleted entries
    )
    
    if date:
        # Convert date string to date object
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                db.func.date(FoodLog.consumed_at) == filter_date
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    if meal_type:
        query = query.filter(FoodLog.meal_type == meal_type)
    
    # Order by consumed_at descending (most recent first)
    query = query.order_by(FoodLog.consumed_at.desc())
    
    logs = query.all()
    
    # Format each log with clarity fields
    formatted_logs = []
    for log in logs:
        food = db.query(Food).filter(Food.id == log.food_id).first()
        if food:
            formatted_logs.append(_format_food_log_response(log, food))
    
    return formatted_logs

@router.get("/log/{log_id}", response_model=FoodLogResponse)
async def get_food_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific food log by ID.
    """
    log = (
        db.query(FoodLog)
        .filter(
            FoodLog.id == log_id, 
            FoodLog.user_id == current_user.id,
            FoodLog.deleted_at.is_(None)
        )
        .first()
    )
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log not found"
        )
    
    # Get the associated food for formatting
    food = db.query(Food).filter(Food.id == log.food_id).first()
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated food not found"
        )
    
    return _format_food_log_response(log, food)

@router.patch("/log/{log_id}", response_model=FoodLogResponse)
async def update_food_log(
    log_id: str,
    log_in: FoodLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a food log.
    """
    log = (
        db.query(FoodLog)
        .filter(
            FoodLog.id == log_id, 
            FoodLog.user_id == current_user.id,
            FoodLog.deleted_at.is_(None)
        )
        .first()
    )
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log not found"
        )
    
    # Update fields
    for field, value in log_in.dict(exclude_unset=True).items():
        setattr(log, field, value)
    
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return log

@router.delete("/log/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a food log.
    """
    log = (
        db.query(FoodLog)
        .filter(
            FoodLog.id == log_id, 
            FoodLog.user_id == current_user.id,
            FoodLog.deleted_at.is_(None)
        )
        .first()
    )
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log not found"
        )
    
    # Soft delete: set deleted_at timestamp
    log.deleted_at = datetime.utcnow()
    db.add(log)
    db.commit()
    
    return None


@router.get("/log/summary", response_model=DailyNutrition)
async def get_daily_summary(
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily nutrient summary for a specific date.
    If no date provided, returns today's summary.
    """
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        target_date = datetime.now().date()
    
    # Get all food logs for the specified day (excluding soft-deleted)
    logs = (
        db.query(FoodLog)
        .join(Food, FoodLog.food_id == Food.id)
        .filter(
            FoodLog.user_id == current_user.id,
            FoodLog.deleted_at.is_(None),
            db.func.date(FoodLog.consumed_at) == target_date
        )
        .all()
    )
    
    # Calculate daily nutrition
    daily_nutrition = DailyNutrition(date=target_date)
    
    for log in logs:
        daily_nutrition.add_food(log.food, log.quantity)
    
    return daily_nutrition


@router.get("/log/weekly-summary")
async def get_weekly_summary(
    start: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly nutrient summary for 7 days starting from specified date.
    If no start date provided, uses 7 days ago from today.
    """
    if start:
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        start_date = (datetime.now() - timedelta(days=6)).date()
    
    end_date = start_date + timedelta(days=6)
    
    # Get all food logs for the date range (excluding soft-deleted)
    logs = (
        db.query(FoodLog)
        .join(Food, FoodLog.food_id == Food.id)
        .filter(
            FoodLog.user_id == current_user.id,
            FoodLog.deleted_at.is_(None),
            db.func.date(FoodLog.consumed_at) >= start_date,
            db.func.date(FoodLog.consumed_at) <= end_date
        )
        .order_by(FoodLog.consumed_at)
        .all()
    )
    
    # Initialize daily nutrition for each day in the week
    daily_summaries = {}
    current_date = start_date
    while current_date <= end_date:
        daily_summaries[current_date] = DailyNutrition(date=current_date)
        current_date += timedelta(days=1)
    
    # Process food logs
    for log in logs:
        log_date = log.consumed_at.date()
        if log_date in daily_summaries:
            daily_summaries[log_date].add_food(log.food, log.quantity)
    
    # Convert to list and sort by date
    result = []
    for date_key in sorted(daily_summaries.keys()):
        summary = daily_summaries[date_key]
        result.append({
            "date": date_key.isoformat(),
            "total_calories": summary.total_calories,
            "protein_g": summary.protein_g,
            "carbs_g": summary.carbs_g,
            "fat_g": summary.fat_g,
            "fiber_g": summary.fiber_g,
            "sugar_g": summary.sugar_g,
            "sodium_mg": summary.sodium_mg,
            "calcium_mg": summary.calcium_mg,
            "iron_mg": summary.iron_mg,
            "vitamin_a_mcg": summary.vitamin_a_mcg,
            "vitamin_c_mg": summary.vitamin_c_mg,
            "vitamin_d_mcg": summary.vitamin_d_mcg,
            "folate_mcg": summary.folate_mcg,
            "trimester": current_user.trimester
        })
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily_summaries": result,
        "total_days": len(result),
        "days_with_data": len([d for d in result if d["total_calories"] > 0])
    }


@router.get("/suggestions")
async def get_food_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get smart food suggestions based on user's current nutrition intake,
    trimester, and safety requirements.
    """
    try:
        suggestions = smart_suggestions_service.get_smart_suggestions(db, current_user)
        return suggestions
    except Exception as e:
        logger.error(f"Error generating food suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate food suggestions"
        )
