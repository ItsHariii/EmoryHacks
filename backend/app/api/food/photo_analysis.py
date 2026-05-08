"""
Photo analysis API endpoint for food identification using Gemini AI Vision.

Sync mode runs the analysis inline. Async mode persists the upload to
object storage and enqueues an arq job; pollers retrieve job state from
Redis. This avoids the previous in-memory dict that lost jobs on restart
and didn't survive multiple workers.
"""

import logging
from typing import Any, Dict, Optional

from arq.connections import ArqRedis, create_pool
from arq.jobs import Job, JobStatus
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.food import Food, FoodSafetyStatus
from app.models.user import User
from app.services import object_storage
from app.services.gemini_vision_service import gemini_vision_service
from app.services.pregnancy_safety_service import pregnancy_safety_service
from app.services.usda_service import usda_service
from app.utils.food_factory import FoodFactory
from app.workers.photo_worker import _redis_settings

logger = logging.getLogger(__name__)
router = APIRouter()
food_factory = FoodFactory()

_arq_pool: Optional[ArqRedis] = None


async def _get_arq_pool() -> ArqRedis:
    """Lazily build the arq Redis pool. Reused across requests."""
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(_redis_settings())
    return _arq_pool


@router.post("/analyze-photo")
async def analyze_food_photo(
    file: UploadFile = File(...),
    mode: str = Query(
        "sync",
        regex="^(sync|async)$",
        description="Analysis mode: 'sync' for immediate result, 'async' for job-based polling",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict:
    """
    Analyze a food photo using Gemini AI Vision and return USDA nutrition data.

    When `mode=sync` (default), this behaves as a traditional request/response API.
    When `mode=async`, it stores the image and returns a `job_id`; the heavy work
    is performed when the job is polled via `/analyze-photo/jobs/{job_id}`.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)",
            )

        # Read image data
        image_data = await file.read()

        # Check file size (max 5MB)
        if len(image_data) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image too large (max 5MB). Please compress the image.",
            )

        logger.info(
            "Processing photo analysis upload for user %s, file size: %s bytes (mode=%s)",
            current_user.id,
            len(image_data),
            mode,
        )

        user_context = {
            "trimester": getattr(current_user, "trimester", None),
            "allergies": getattr(current_user, "allergies", None),
        }

        # Async mode: persist blob, enqueue arq job. Survives process restarts.
        if mode == "async":
            image_key = object_storage.put_image(image_data, suffix=".jpg")
            pool = await _get_arq_pool()
            job = await pool.enqueue_job(
                "analyze_photo_job",
                image_key=image_key,
                user_id=str(current_user.id),
                user_context=user_context,
                _queue_name=settings.ARQ_QUEUE_NAME,
            )
            if job is None:
                # arq returns None when a job with the same id already exists
                # (deduplication). We don't dedup, so this is unexpected.
                object_storage.delete_image(image_key)
                raise HTTPException(
                    status_code=500,
                    detail="Could not enqueue photo analysis job.",
                )
            logger.info(
                "Enqueued photo analysis job %s for user %s (image_key=%s)",
                job.job_id, current_user.id, image_key,
            )
            return {
                "job_id": job.job_id,
                "status": "queued",
                "mode": "async",
            }

        # Default: synchronous analysis
        return await _perform_photo_analysis(
            image_data=image_data,
            user_context=user_context,
            user_id=str(current_user.id),
            db=db,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error in photo analysis: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Photo analysis failed. Please try again or use manual search.",
        )


@router.get("/analyze-photo/jobs/{job_id}")
async def get_photo_analysis_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Poll an arq photo-analysis job. Returns queued/running/completed/failed."""
    pool = await _get_arq_pool()
    job = Job(job_id, redis=pool, _queue_name=settings.ARQ_QUEUE_NAME)
    job_status = await job.status()

    if job_status == JobStatus.not_found:
        raise HTTPException(status_code=404, detail="Job not found")

    if job_status in (JobStatus.queued, JobStatus.deferred, JobStatus.in_progress):
        return {
            "job_id": job_id,
            "status": "queued" if job_status == JobStatus.queued else "running",
        }

    # complete: get result and authorize against the stored user_id.
    info = await job.info()
    expected_user = None
    if info and info.kwargs:
        expected_user = info.kwargs.get("user_id")
    if expected_user and expected_user != str(current_user.id):
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        result = await job.result(timeout=0)
    except Exception as e:
        logger.error("Photo analysis job %s failed: %s", job_id, e)
        return {
            "job_id": job_id,
            "status": "failed",
            "error": "Photo analysis failed. Please try again or use manual search.",
        }

    return {
        "job_id": job_id,
        "status": "completed",
        "result": result,
    }


async def _perform_photo_analysis(
    *,
    image_data: bytes,
    user_context: Dict[str, Any],
    user_id: str,
    db: Session,
) -> Dict[str, Any]:
    """
    Core photo-analysis flow shared between sync and async-style endpoints.
    """
    logger.info(
        "Running photo analysis for user %s, file size: %s bytes", user_id, len(image_data)
    )

    # Step 1: Analyze with Gemini AI
    ai_result = await gemini_vision_service.analyze_food_image(
        image_data=image_data,
        user_context=user_context,
    )

    if not ai_result.get("success"):
        error_type = ai_result.get("error_type", "unknown")
        error_message = ai_result.get("error", "Analysis failed")

        # Map error types to user-friendly messages
        user_messages = {
            "service_unavailable": "Photo analysis is temporarily unavailable. Please try manual search.",
            "analysis_failed": "Could not analyze the photo. Please try again or use manual search.",
            "parse_error": "Could not understand the analysis results. Please try again.",
        }

        return {
            "success": False,
            "error": user_messages.get(error_type, error_message),
            "error_type": error_type,
            "fallback_action": "manual_search",
        }

    # Extract AI results
    food_name = ai_result.get("food_name", "")
    confidence = ai_result.get("confidence", 0)
    portion_size = ai_result.get("portion_size")
    portion_unit = ai_result.get("portion_unit", "g")
    ingredients = ai_result.get("ingredients", [])
    pregnancy_concerns = ai_result.get("pregnancy_concerns", [])

    logger.info(
        "AI identified for user %s: %s (%s%% confidence), portion: %s %s",
        user_id,
        food_name,
        confidence,
        portion_size,
        portion_unit,
    )

    # Step 2: Search USDA database
    usda_results = await usda_service.search_foods(food_name, page_size=5)

    if not usda_results:
        logger.warning("No USDA results found for '%s' (user %s)", food_name, user_id)
        return {
            "success": True,
            "food_name": food_name,
            "confidence": confidence,
            "portion_size": portion_size,
            "portion_unit": portion_unit,
            "ingredients": ingredients,
            "pregnancy_concerns": pregnancy_concerns,
            "usda_match": None,
            "message": "Food identified but not found in USDA database. You can search manually for nutrition data.",
            "fallback_action": "manual_search",
        }

    # Get the best match (first result)
    best_match = usda_results[0]
    fdc_id = best_match.get("fdcId")

    # Step 3: Check if this food already exists in our database
    existing_food = db.query(Food).filter(Food.fdc_id == fdc_id).first()

    if not existing_food:
        # Create Food object from USDA data
        logger.info("Creating new food entry for FDC ID %s (user %s)", fdc_id, user_id)
        existing_food = await food_factory.create_food_from_usda(db, str(fdc_id))

    # Step 4: Parse nutrition data for response
    nutrients = usda_service.parse_nutrients(best_match)
    basic_info = usda_service.extract_basic_info(best_match)

    # Step 5: Check pregnancy safety
    # Combine AI-detected ingredients with USDA ingredients
    all_ingredients = list(set(ingredients + basic_info.get("ingredients", [])))

    safety_status, safety_notes, ingredient_details = pregnancy_safety_service.check_food_safety(
        ingredients=all_ingredients,
        spoonacular_data=None,
    )

    # Add pregnancy concerns from AI
    if pregnancy_concerns:
        safety_notes += f" AI detected potential concerns: {', '.join(pregnancy_concerns)}"
        if safety_status == "safe":
            safety_status = "limited"  # Downgrade if AI found concerns

    # Update food safety status if needed. Coerce string to enum so the
    # column write goes through the same type as everywhere else in the app.
    try:
        safety_enum = FoodSafetyStatus(safety_status)
    except ValueError:
        logger.warning("Unknown safety_status %r — falling back to LIMITED", safety_status)
        safety_enum = FoodSafetyStatus.LIMITED

    if existing_food and existing_food.safety_status != safety_enum:
        existing_food.safety_status = safety_enum
        existing_food.safety_notes = safety_notes
        db.commit()

    logger.info("Photo analysis complete for user %s: %s, safety: %s", user_id, food_name, safety_status)

    # Step 6: Build response in the same format as food search
    # This format matches what the food logs table expects
    response = {
        "success": True,
        "ai_analysis": {
            "food_name": food_name,
            "confidence": confidence,
            "estimated_portion_size": portion_size,
            "estimated_portion_unit": portion_unit,
            "detected_ingredients": ingredients,
            "pregnancy_concerns": pregnancy_concerns,
        },
        "food": {
            "id": f"usda_{fdc_id}",  # Use USDA prefix for compatibility with food logging
            "fdc_id": str(fdc_id),
            "name": existing_food.name if existing_food else basic_info.get("name"),
            "description": existing_food.description if existing_food else basic_info.get(
                "description"
            ),
            "brand": existing_food.brand if existing_food else basic_info.get("brand"),
            "category": existing_food.category if existing_food else basic_info.get("category"),
            "source": "usda",
            "serving_size": existing_food.serving_size if existing_food else 100,
            "serving_unit": existing_food.serving_unit if existing_food else "g",
            "calories": existing_food.calories
            if existing_food
            else nutrients.get("calories", {}).get("amount", 0),
            "nutrients": {
                "protein": {
                    "amount": existing_food.protein
                    if existing_food
                    else nutrients.get("protein", {}).get("amount", 0),
                    "unit": "g",
                },
                "carbs": {
                    "amount": existing_food.carbs
                    if existing_food
                    else nutrients.get("carbs", {}).get("amount", 0),
                    "unit": "g",
                },
                "fat": {
                    "amount": existing_food.fat
                    if existing_food
                    else nutrients.get("fat", {}).get("amount", 0),
                    "unit": "g",
                },
                "fiber": {
                    "amount": existing_food.fiber
                    if existing_food
                    else nutrients.get("fiber", {}).get("amount", 0),
                    "unit": "g",
                },
                "sugar": {
                    "amount": existing_food.sugar
                    if existing_food
                    else nutrients.get("sugar", {}).get("amount", 0),
                    "unit": "g",
                },
            },
            "micronutrients": existing_food.micronutrients if existing_food else nutrients,
            "ingredients": all_ingredients,
            "safety_status": safety_status,
            "safety_notes": safety_notes,
            "is_verified": existing_food.is_verified if existing_food else False,
        },
        "alternative_matches": [
            {
                "id": f"usda_{item.get('fdcId')}",
                "fdc_id": str(item.get("fdcId")),
                "name": item.get("description"),
                "brand": item.get("brandOwner") or item.get("brandName"),
                "source": "usda",
                "data_type": item.get("dataType"),
            }
            for item in usda_results[1:5]  # Include up to 4 alternatives
        ],
    }

    return response
