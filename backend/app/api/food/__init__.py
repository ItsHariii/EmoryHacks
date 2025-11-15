"""
Food API module.
Combines all food-related endpoints into a single router.
"""
from fastapi import APIRouter

from .safety import router as safety_router
from .search import router as search_router
from .logging import router as logging_router
from .nutrition import router as nutrition_router

# Create main food router
router = APIRouter()

# Include all sub-routers
router.include_router(safety_router, tags=["Food Safety"])
router.include_router(search_router, tags=["Food Search"])
router.include_router(logging_router, tags=["Food Logging"])
router.include_router(nutrition_router, tags=["Food Nutrition"])
