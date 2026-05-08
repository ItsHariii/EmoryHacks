"""Per-service RateLimiter tests (in-memory backend)."""
from __future__ import annotations

import asyncio

import pytest

from app.core.config import settings
from app.services.rate_limiter import RateLimiter


@pytest.fixture
def small_limit_settings(monkeypatch):
    """Force a small known-window limit for the 'test' service."""
    limits = dict(settings.EXTERNAL_RATE_LIMITS)
    limits["test"] = (3, 60)  # 3 calls / 60s
    monkeypatch.setattr(settings, "EXTERNAL_RATE_LIMITS", limits)
    yield


@pytest.mark.asyncio
async def test_acquire_allows_up_to_limit(small_limit_settings):
    rl = RateLimiter(backend="memory")
    granted = []
    for _ in range(5):
        granted.append(await rl.acquire("test"))
    assert granted == [True, True, True, False, False]


@pytest.mark.asyncio
async def test_remaining_decreases(small_limit_settings):
    rl = RateLimiter(backend="memory")
    assert rl.get_remaining_requests("test") == 3
    await rl.acquire("test")
    assert rl.get_remaining_requests("test") == 2


@pytest.mark.asyncio
async def test_reset_service_clears_bucket(small_limit_settings):
    rl = RateLimiter(backend="memory")
    for _ in range(3):
        await rl.acquire("test")
    assert await rl.acquire("test") is False
    rl.reset_service("test")
    assert await rl.acquire("test") is True


@pytest.mark.asyncio
async def test_unknown_service_falls_back_to_default():
    rl = RateLimiter(backend="memory")
    # Default limit comes from settings.EXTERNAL_RATE_LIMITS["default"]; just
    # confirm acquire() returns True at least once.
    assert await rl.acquire("unknown-service") is True
