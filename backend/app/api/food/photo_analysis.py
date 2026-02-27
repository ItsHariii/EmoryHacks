"""
Photo analysis API endpoint for food identification using Gemini AI Vision.

This endpoint:
1. Accepts a food photo upload
2. Uses Gemini AI to identify the food and estimate portion
3. Searches USDA database for nutrition data
4. Checks pregnancy safety
5. Returns combined results in the same format as food search
6. Allows direct logging of the analyzed food

It also supports an optional background-style mode where the initial request
returns a lightweight `job_id`, and a separate endpoint performs the heavy
analysis work when polled.
"""

import logging
from datetime import datetime
from typing import Any, Dict
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.food import Food
from app.models.user import User
from app.services.gemini_vision_service import gemini_vision_service
from app.services.pregnancy_safety_service import pregnancy_safety_service
from app.services.usda_service import usda_service
from app.utils.food_factory import FoodFactory

logger = logging.getLogger(__name__)
router = APIRouter()
food_factory = FoodFactory()

# In-memory store for optional background-style jobs.
# This keeps the design simple while making it easy to move to a real queue later.
photo_analysis_jobs: Dict[str, Dict[str, Any]] = {}


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

        # Optional background-style mode: enqueue job and return job_id
        if mode == "async":
            job_id = str(uuid4())
            photo_analysis_jobs[job_id] = {
                "status": "pending",
                "user_id": str(current_user.id),
                "user_context": user_context,
                "image_data": image_data,
                "created_at": datetime.utcnow().isoformat(),
            }
            logger.info("Created photo analysis job %s for user %s", job_id, current_user.id)
            return {
                "job_id": job_id,
                "status": "pending",
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
    db: Session = Depends(get_db),
) -> Dict:
    """
    Poll and optionally execute a background-style photo analysis job.

    - If the job is still pending, this call will run the analysis and transition
      the job to a completed or failed state.
    - Subsequent calls will simply return the stored result.
    """
    job = photo_analysis_jobs.get(job_id)
    if not job or job.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=404, detail="Job not found")

    status = job.get("status")

    # Run the analysis on first meaningful poll
    if status == "pending":
        logger.info("Starting execution of photo analysis job %s for user %s", job_id, current_user.id)
        job["status"] = "running"
        try:
            image_data = job.pop("image_data")
            user_context = job.get("user_context", {})
            result = await _perform_photo_analysis(
                image_data=image_data,
                user_context=user_context,
                user_id=str(current_user.id),
                db=db,
            )
            job["status"] = "completed"
            job["result"] = result
        except HTTPException as e:
            job["status"] = "failed"
            job["error"] = e.detail
            raise
        except Exception as e:
            logger.error("Error running photo analysis job %s: %s", job_id, e, exc_info=True)
            job["status"] = "failed"
            job["error"] = "Photo analysis failed. Please try again or use manual search."
            raise HTTPException(
                status_code=500,
                detail="Photo analysis failed. Please try again or use manual search.",
            )

    # Return status to caller
    if job["status"] in ("pending", "running"):
        return {
            "job_id": job_id,
            "status": job["status"],
        }

    if job["status"] == "completed":
        return {
            "job_id": job_id,
            "status": "completed",
            "result": job.get("result"),
        }

    # failed
    return {
        "job_id": job_id,
        "status": "failed",
        "error": job.get("error"),
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

    # Update food safety status if needed
    if existing_food and existing_food.safety_status != safety_status:
        existing_food.safety_status = safety_status
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
