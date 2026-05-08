"""Heuristic classification of free-text food queries.

Shared by search (Spoonacular product vs ingredient routing) and photo
analysis (deciding whether to fetch packaged-product nutrition or raw
ingredient nutrition). Pure functions — no external deps.
"""

from __future__ import annotations


PRODUCT_INDICATORS: tuple[str, ...] = (
    # Brand names
    "kraft", "nestle", "kellogg", "general mills", "pepsi", "coca cola", "frito lay",
    "campbell", "heinz", "oreo", "cheerios", "doritos", "lay's", "pringles",
    # Packaged-food terms
    "cereal", "crackers", "chips", "cookies", "frozen", "canned", "bottled",
    "packaged", "instant", "mix", "sauce", "dressing", "snack", "bar",
    "yogurt", "cheese", "bread", "pasta", "pizza", "soup", "juice",
    # Common product-name patterns
    "whole wheat", "low fat", "organic", "gluten free", "sugar free",
)

INGREDIENT_INDICATORS: tuple[str, ...] = (
    "fresh", "raw", "ground", "chopped", "diced", "sliced", "whole",
    "apple", "banana", "carrot", "onion", "garlic", "tomato", "potato",
    "chicken", "beef", "pork", "fish", "salmon", "tuna",
    "flour", "sugar", "salt", "pepper", "oil", "butter", "egg",
    "rice", "beans", "lentils", "quinoa", "oats",
)

BASIC_INGREDIENTS: tuple[str, ...] = (
    "apple", "banana", "carrot", "onion", "garlic", "tomato", "potato",
    "chicken", "beef", "pork", "fish", "salmon", "tuna", "egg", "eggs",
    "flour", "sugar", "salt", "pepper", "oil", "butter",
    "rice", "beans", "lentils", "quinoa", "oats", "milk",
    "orange", "lemon", "lime", "strawberry", "blueberry", "grape",
    "lettuce", "spinach", "broccoli", "cauliflower", "cucumber",
    "cheese", "yogurt", "bread", "pasta",
)


def classify_as_product(query: str) -> bool:
    """Return True when the query is more likely a packaged product than a
    raw ingredient. Score-based: brand/product terms vs ingredient terms,
    plus length and digit heuristics.
    """
    query_lower = query.lower().strip()

    product_score = sum(1 for ind in PRODUCT_INDICATORS if ind in query_lower)
    ingredient_score = sum(1 for ind in INGREDIENT_INDICATORS if ind in query_lower)

    if len(query.split()) > 3:
        product_score += 1
    if any(ch.isdigit() for ch in query):
        product_score += 1

    return product_score > ingredient_score


def is_basic_ingredient(query: str) -> bool:
    """Return True if the query is a basic raw ingredient — used to force
    USDA fallback for things Spoonacular often misses (apple, banana, etc.).
    """
    query_lower = query.lower().strip()
    for ingredient in BASIC_INGREDIENTS:
        if (
            query_lower == ingredient
            or query_lower == ingredient + "s"
            or query_lower + "s" == ingredient
        ):
            return True
    return False
