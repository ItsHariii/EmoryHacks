"""
Food logging endpoints.
Handles CRUD operations for food consumption logs.
"""
import logging
from datetime import datetime, timedelta, date as date_type
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.services.nutrition_calculator_service import NutritionCalculatorService
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.food import Food, FoodLog
from app.schemas.food import FoodLogCreate, FoodLogUpdate, FoodLogResponse, DailyNutrition
from app.services.usda_service import USDAService
from app.services.smart_suggestions_service import smart_suggestions_service
from app.services.pregnancy_safety_service import pregnancy_safety_service
from app.services.allergen_service import check_allergens
from app.utils.food_factory import FoodFactory
from app.core.config import settings
from app.middleware.idempotency import idempotency_check, idempotency_store

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

def _build_safety_verdict(food: Food, user: Optional[User]) -> Optional[dict]:
    """Return the safety verdict for a food.

    Prefers the persisted Food.safety_verdict column (written at ingest, may
    carry a Gemini layer-5 finding) so reads don't recompute. Falls back to
    a fresh layered evaluation if the column is empty — keeps backward
    compatibility with rows that pre-date the column.
    """
    try:
        persisted = getattr(food, "safety_verdict", None)
        # User trimester only matters when re-evaluating; the persisted
        # verdict was computed at ingest with a generic trimester. If the
        # user has a real trimester, re-eval for trimester-specific rules.
        user_trimester = getattr(user, "trimester", None) if user else None
        if persisted and not user_trimester:
            return persisted

        ingredients = list(getattr(food, "ingredients", None) or [])
        if not ingredients and getattr(food, "name", None):
            ingredients = [food.name]
        return pregnancy_safety_service.evaluate(
            ingredients,
            food_category=getattr(food, "category", None),
            trimester=user_trimester,
        )
    except Exception as e:
        logger.warning("Safety verdict generation failed for food %s: %s", getattr(food, "id", None), e)
        return None


def _format_food_log_response(
    food_log: FoodLog,
    food: Food,
    serving_size: float = None,
    serving_unit: str = None,
    user: Optional[User] = None,
) -> dict:
    """Helper function to format food log response with clarity fields."""
    actual_serving_size = serving_size or food.serving_size
    actual_serving_unit = serving_unit or food.serving_unit

    safety_verdict = _build_safety_verdict(food, user)
    allergen_hits = check_allergens(food, user) if user else []

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
            "safety_verdict": safety_verdict,
            "allergen_hits": allergen_hits,
            "fdc_id": str(food.fdc_id) if food.fdc_id is not None else None,
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
    db: Session = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Log a food item for the current user.
    Handles both local database foods and USDA foods.
    """
    # Replay protection: if the client retries the same logical write within
    # the idempotency window (default 60s), return the stored response instead
    # of double-inserting. Keyed on (user, header, canonical request body) so
    # accidental key reuse with different body still goes through.
    request_signature = log_in.dict()
    replay = await idempotency_check(
        scope="food_log",
        user_id=str(current_user.id),
        key=idempotency_key,
        body=request_signature,
    )
    if replay is not None:
        logger.info(
            "Idempotent replay for food_log key=%s user=%s",
            idempotency_key, current_user.id,
        )
        return replay

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
                food = await food_factory.create_food_from_usda(db, fdc_id)
                
        except Exception as e:
            logger.error(f"Error processing USDA food {food_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process USDA food: {str(e)}"
            )
    else:
        # Regular food lookup by UUID
        food = db.query(Food).filter(Food.id == food_id).first()
    
    if not food:
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
        try:
            db.flush()
            db.refresh(food_log)
            db.commit()
        except Exception as db_err:
            db.rollback()
            logger.error(f"Database error creating food log: {db_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save food log"
            )

        logger.info(f"Successfully created food log {food_log.id} with {nutrition_data['calories_logged']} calories")

        # Format response with serving info
        response = _format_food_log_response(food_log, food, user=current_user)

        # Stash for replay within the idempotency window.
        await idempotency_store(
            scope="food_log",
            user_id=str(current_user.id),
            key=idempotency_key,
            body=request_signature,
            response=response,
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating food log: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create food log"
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
                func.date(FoodLog.consumed_at) == filter_date
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    if meal_type:
        query = query.filter(FoodLog.meal_type == meal_type)
    
    # Order by consumed_at descending (most recent first). Eager-load food to avoid N+1.
    query = query.options(joinedload(FoodLog.food)).order_by(FoodLog.consumed_at.desc())

    logs = query.all()

    formatted_logs = []
    for log in logs:
        if log.food:
            formatted_logs.append(_format_food_log_response(log, log.food, user=current_user))

    return formatted_logs

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
            func.date(FoodLog.consumed_at) == target_date
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
            func.date(FoodLog.consumed_at) >= start_date,
            func.date(FoodLog.consumed_at) <= end_date
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
            "magnesium_mg": summary.magnesium_mg,
            "zinc_mg": summary.zinc_mg,
            "potassium_mg": summary.potassium_mg,
            "choline_mg": summary.choline_mg,
            "dha_mg": summary.dha_mg,
            "omega3_mg": summary.omega3_mg,
            "trimester": current_user.trimester
        })

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily_summaries": result,
        "total_days": len(result),
        "days_with_data": len([d for d in result if d["total_calories"] > 0])
    }


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

    return _format_food_log_response(log, food, user=current_user)


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

    food = db.query(Food).filter(Food.id == log.food_id).first()
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated food not found"
        )

    update_fields = log_in.dict(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(log, field, value)

    # Recompute nutrition when serving size, serving unit, or quantity changes,
    # otherwise stored calories_logged/nutrients_logged go stale.
    if any(k in update_fields for k in ("serving_size", "serving_unit", "quantity")):
        nutrition_calculator = NutritionCalculatorService()
        nutrition_data = nutrition_calculator.calculate_consumed_nutrition(
            food=food,
            user_serving_size=log.serving_size,
            user_serving_unit=log.serving_unit,
            quantity=log.quantity or 1.0,
        )
        log.calories_logged = nutrition_data['calories_logged']
        log.nutrients_logged = nutrition_data['nutrients_logged']

    log.updated_at = datetime.utcnow()
    db.add(log)
    db.commit()
    db.refresh(log)

    return _format_food_log_response(log, food, user=current_user)


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
