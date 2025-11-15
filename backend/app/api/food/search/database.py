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
from ....models.ingredient import Ingredient
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

def search_local_ingredients(query: str, db: Session, limit: int = 5) -> List[Ingredient]:
    """Search for ingredients in the local database."""
    ingredient_filters = []
    ingredient_filters.append(func.lower(Ingredient.name) == func.lower(query))
    ingredient_filters.extend([
        Ingredient.name.ilike(f"{query}%"),
        Ingredient.name.ilike(f"%{query}%")
    ])
    
    if query.isdigit():
        query_int = int(query)
        ingredient_filters.extend([
            Ingredient.spoonacular_id == query_int,
            Ingredient.fdc_id == query_int
        ])
    
    return (
        db.query(Ingredient)
        .filter(or_(*ingredient_filters))
        .order_by(
            case(
                (func.lower(Ingredient.name) == func.lower(query), 1),
                else_=2
            ),
            Ingredient.created_at.desc()
        )
        .limit(limit)
        .all()
    )

def search_local_database(query: str, db: Session) -> Tuple[List[Food], List[Ingredient]]:
    """
    Search both foods and ingredients in the local database.
    Returns tuple of (foods, ingredients).
    """
    logger.info(f"Searching local database for '{query}'")
    
    foods = search_local_foods(query, db)
    ingredients = search_local_ingredients(query, db)
    
    logger.info(f"Found {len(foods)} foods and {len(ingredients)} ingredients in local database")
    
    return foods, ingredients
