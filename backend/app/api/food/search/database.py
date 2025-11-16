"""
Database search functionality for food search.
Handles local database queries for foods and ingredients.
"""
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, case
from typing import List, Tuple

from ....models.food import Food
from ....schemas.food import FoodSearchResult, FoodSafetyStatus

logger = logging.getLogger(__name__)

def search_local_foods(query: str, db: Session, limit: int = 5) -> List[Food]:
    """Search for foods in the local database."""
    food_filters = []
    food_filters.append(func.lower(Food.name) == func.lower(query))
    food_filters.extend([
        Food.name.ilike(f"{query}%"),
        Food.brand.ilike(f"{query}%") if query else None,
        Food.name.ilike(f"%{query}%")
    ])
    food_filters = [f for f in food_filters if f is not None]
    
    if query.isdigit():
        query_int = int(query)
        food_filters.extend([
            Food.spoonacular_id == query_int,
            Food.fdc_id == query_int
        ])
    
    return (
        db.query(Food)
        .filter(or_(*food_filters))
        .order_by(
            case(
                (func.lower(Food.name) == func.lower(query), 1),
                else_=2
            ),
            Food.is_verified.desc(),
            Food.created_at.desc()
        )
        .limit(limit)
        .all()
    )

# Ingredient search removed - ingredients table does not exist in current schema
# All food items are stored in the foods table

def search_local_database(query: str, db: Session) -> Tuple[List[Food], List]:
    """
    Search foods in the local database.
    Returns tuple of (foods, empty list) for compatibility.
    Note: ingredients table does not exist in current schema.
    """
    logger.info(f"Searching local database for '{query}'")
    
    foods = search_local_foods(query, db)
    
    logger.info(f"Found {len(foods)} foods in local database")
    
    return foods, []
