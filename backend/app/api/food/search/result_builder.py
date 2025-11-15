"""
Result builder for food search.
Transforms database objects into API response format.
"""
import json
import logging
from typing import List

from ....models.food import Food
from ....models.ingredient import Ingredient
from ....schemas.food import FoodSearchResult, FoodSafetyStatus

logger = logging.getLogger(__name__)

def build_food_result(food: Food) -> FoodSearchResult:
    """Convert a Food database object to FoodSearchResult."""
    # Parse micronutrients JSON string to dict
    micronutrients = {}
    if food.micronutrients:
        try:
            if isinstance(food.micronutrients, str):
                micronutrients = json.loads(food.micronutrients)
            elif isinstance(food.micronutrients, dict):
                micronutrients = food.micronutrients
        except (json.JSONDecodeError, TypeError):
            micronutrients = {}
    
    return FoodSearchResult(
        id=str(food.id),
        name=food.name,
        brand=food.brand,
        serving_size=food.serving_size,
        serving_unit=food.serving_unit,
        calories=food.calories,
        safety_status=food.safety_status or FoodSafetyStatus.LIMITED,
        protein=food.protein,
        carbs=food.carbs,
        fat=food.fat,
        fiber=food.fiber,
        sugar=food.sugar,
        sodium=0.0,  # Foods table doesn't have sodium column
        micronutrients=micronutrients,
        source=food.source,
        item_type="food"
    )

def build_ingredient_result(ingredient: Ingredient) -> FoodSearchResult:
    """Convert an Ingredient database object to FoodSearchResult."""
    # Parse micronutrients JSON string to dict
    micronutrients = {}
    if ingredient.micronutrients:
        try:
            if isinstance(ingredient.micronutrients, str):
                micronutrients = json.loads(ingredient.micronutrients)
            elif isinstance(ingredient.micronutrients, dict):
                micronutrients = ingredient.micronutrients
        except (json.JSONDecodeError, TypeError):
            micronutrients = {}
    
    return FoodSearchResult(
        id=str(ingredient.id),
        name=ingredient.name,
        brand=None,  # Ingredients don't have brands
        serving_size=100.0,  # Ingredients are per 100g
        serving_unit="g",
        calories=ingredient.calories,
        safety_status=ingredient.safety_status or FoodSafetyStatus.LIMITED,
        protein=ingredient.protein,
        carbs=ingredient.carbs,
        fat=ingredient.fat,
        fiber=ingredient.fiber,
        sugar=ingredient.sugar,
        sodium=ingredient.sodium,
        micronutrients=micronutrients,
        source=ingredient.source.value if ingredient.source else "manual",
        item_type="ingredient"
    )

def build_usda_ingredient_result(ingredient: Ingredient) -> FoodSearchResult:
    """Convert a USDA Ingredient to FoodSearchResult with proper formatting."""
    micronutrients = {}
    if ingredient.micronutrients:
        try:
            if isinstance(ingredient.micronutrients, str):
                micronutrients = json.loads(ingredient.micronutrients)
            else:
                micronutrients = ingredient.micronutrients
        except (json.JSONDecodeError, TypeError):
            micronutrients = {}
    
    return FoodSearchResult(
        id=str(ingredient.id),
        name=ingredient.name,
        brand=None,
        serving_size=100.0,
        serving_unit="g",
        calories=ingredient.calories or 0.0,
        safety_status=ingredient.safety_status or FoodSafetyStatus.LIMITED,
        protein=ingredient.protein or 0.0,
        carbs=ingredient.carbs or 0.0,
        fat=ingredient.fat or 0.0,
        fiber=ingredient.fiber or 0.0,
        sugar=ingredient.sugar or 0.0,
        sodium=ingredient.sodium or 0.0,
        micronutrients=micronutrients,
        source=ingredient.source or "USDA",
        item_type="ingredient"
    )

def build_usda_food_result(food: Food) -> FoodSearchResult:
    """Convert a USDA Food to FoodSearchResult with proper formatting."""
    micronutrients = {}
    if food.micronutrients:
        try:
            if isinstance(food.micronutrients, str):
                micronutrients = json.loads(food.micronutrients)
            else:
                micronutrients = food.micronutrients
        except (json.JSONDecodeError, TypeError):
            micronutrients = {}
    
    return FoodSearchResult(
        id=str(food.id),
        name=food.name,
        brand=food.brand,
        serving_size=food.serving_size,
        serving_unit=food.serving_unit,
        calories=food.calories,
        safety_status=food.safety_status or FoodSafetyStatus.LIMITED,
        protein=food.protein,
        carbs=food.carbs,
        fat=food.fat,
        fiber=food.fiber,
        sugar=food.sugar,
        sodium=0.0,  # Foods table doesn't have sodium column
        micronutrients=micronutrients,
        source=food.source,
        item_type="food"
    )

def build_search_results(foods: List[Food], ingredients: List[Ingredient]) -> List[FoodSearchResult]:
    """
    Build search results from lists of foods and ingredients.
    Returns combined list of FoodSearchResult objects.
    """
    results = []
    
    # Add foods to results
    for food in foods:
        results.append(build_food_result(food))
    
    # Add ingredients to results
    for ingredient in ingredients:
        results.append(build_ingredient_result(ingredient))
    
    logger.info(f"Built {len(results)} search results ({len(foods)} foods, {len(ingredients)} ingredients)")
    
    return results
