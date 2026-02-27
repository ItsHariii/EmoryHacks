"""
Food API module.
Combines all food-related endpoints into a single router.
"""
from fastapi import APIRouter

from .safety import router as safety_router
from .lookup import router as search_router
from .logging import router as logging_router
from .nutrition import router as nutrition_router
from .photo_analysis import router as photo_analysis_router
from .chatbot import router as chatbot_router

# Create main food router
router = APIRouter()

# Include all sub-routers
router.include_router(safety_router, tags=["Food Safety"])
router.include_router(logging_router, tags=["Food Logging"])
router.include_router(nutrition_router, tags=["Food Nutrition"])
router.include_router(photo_analysis_router, tags=["Photo Analysis"])
router.include_router(chatbot_router, tags=["Food Chatbot"])
# Search router has a catch-all /{food_id} route, so it must be last
router.include_router(search_router, tags=["Food Search"])
