"""Cache service behavior tests."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from app.models.food import Food, FoodSafetyStatus, FoodSource
from app.services.cache_service import CacheService


@pytest.fixture
def svc():
    return CacheService()


def _food(db_session, **kwargs) -> Food:
    food = Food(
        name=kwargs.pop("name", "Test"),
        serving_size=100.0,
        serving_unit="g",
        calories=100.0,
        protein=1.0,
        carbs=1.0,
        fat=1.0,
        source=kwargs.pop("source", FoodSource.USDA),
        safety_status=FoodSafetyStatus.SAFE,
        **kwargs,
    )
    db_session.add(food)
    db_session.commit()
    db_session.refresh(food)
    return food


def test_hash_uses_sha256(svc):
    h = svc.generate_food_hash("apple", brand=None, serving_size=100)
    # SHA-256 hex digest is 64 chars; MD5 was 32.
    assert len(h) == 64
    assert all(c in "0123456789abcdef" for c in h)


def test_hash_is_deterministic_and_normalized(svc):
    a = svc.generate_food_hash("Apple", brand=" Brand ", serving_size=100)
    b = svc.generate_food_hash("apple", brand="brand", serving_size=100)
    assert a == b


def test_cache_expires_at_takes_precedence(svc, db_session):
    fresh = _food(db_session, name="Fresh", cache_expires_at=datetime.utcnow() + timedelta(hours=1))
    stale = _food(db_session, name="Stale", cache_expires_at=datetime.utcnow() - timedelta(hours=1))
    assert svc.is_cache_valid(fresh) is True
    assert svc.is_cache_valid(stale) is False


def test_mark_stale_backdates_updated_at(svc, db_session):
    food = _food(db_session, name="Stale me")
    affected = svc.mark_stale(db_session, food_id=food.id)
    assert affected == 1
    db_session.refresh(food)
    # updated_at should now be older than the largest TTL
    assert food.updated_at < datetime.utcnow() - timedelta(days=180)


def test_invalidate_hard_deletes_row(svc, db_session):
    food = _food(db_session, name="Delete me")
    affected = svc.invalidate_cache(db_session, food_id=food.id, hard=True)
    assert affected == 1
    assert db_session.query(Food).filter(Food.id == food.id).first() is None


def test_find_duplicates_skips_low_similarity(svc, db_session):
    _food(db_session, name="Granny Smith Apple")
    duplicates = svc.find_duplicates(db_session, name="completely unrelated", brand=None)
    assert duplicates == []
