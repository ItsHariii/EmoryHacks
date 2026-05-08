"""Food classifier heuristic tests."""
from __future__ import annotations

import pytest

from app.services.food_classifier import classify_as_product, is_basic_ingredient


@pytest.mark.parametrize(
    "query",
    ["apple", "banana", "salmon", "rice", "broccoli"],
)
def test_basic_ingredients_recognized(query):
    assert is_basic_ingredient(query) is True


@pytest.mark.parametrize(
    "query",
    ["Cheerios cereal", "Doritos", "Pepsi cola", "frozen pizza", "low fat yogurt bar"],
)
def test_product_queries_classified_as_product(query):
    assert classify_as_product(query) is True


@pytest.mark.parametrize("query", ["apple", "raw chicken breast", "ground beef"])
def test_ingredient_queries_classified_as_ingredient(query):
    assert classify_as_product(query) is False


def test_long_query_biased_toward_product():
    # Multi-word queries with no strong ingredient signal lean product.
    assert classify_as_product("artisan stone fired sourdough loaf") is True


def test_basic_ingredient_handles_plural():
    assert is_basic_ingredient("eggs") is True
    assert is_basic_ingredient("apples") is True
