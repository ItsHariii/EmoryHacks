"""Idempotency helpers for write endpoints.

Backed by Redis when `settings.REDIS_URL` is set; otherwise falls back to a
process-local LRU so single-instance dev still gets deduplication. Production
should always run with Redis so multiple API workers share the same map.

Usage (FastAPI route):

    from app.middleware.idempotency import idempotency_check, idempotency_store

    @router.post("/log")
    async def log_food(
        body: FoodLogCreate,
        idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
        current_user: User = Depends(get_current_user),
        ...
    ):
        replay = await idempotency_check(
            scope="food_log",
            user_id=str(current_user.id),
            key=idempotency_key,
            body=body.dict(),
        )
        if replay is not None:
            return replay

        result = ...  # do the real work

        await idempotency_store(
            scope="food_log",
            user_id=str(current_user.id),
            key=idempotency_key,
            body=body.dict(),
            response=result,
        )
        return result

The hash is `SHA256(scope + user_id + key + canonical_body)` so two writes
that share a key but differ in body do NOT collide (the second goes through).
TTL is 60 s — long enough to catch flaky-network retries, short enough that
state doesn't pile up.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from collections import OrderedDict
from typing import Any, Dict, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Default window in seconds. Tunable per call.
DEFAULT_TTL_SECONDS = 60

# Local fallback when Redis is unavailable. Bounded so a misbehaving client
# can't grow it without limit.
_MAX_LOCAL_ENTRIES = 2048

_local_store: "OrderedDict[str, tuple[float, Any]]" = OrderedDict()
_local_lock = asyncio.Lock()

_redis = None
_redis_initialized = False


def _canonical_body(body: Optional[Dict[str, Any]]) -> str:
    if not body:
        return ""
    try:
        return json.dumps(body, sort_keys=True, default=str, separators=(",", ":"))
    except (TypeError, ValueError):
        return ""


def _hash_key(scope: str, user_id: str, key: Optional[str], body: Optional[Dict[str, Any]]) -> Optional[str]:
    if not key:
        return None
    digest = hashlib.sha256()
    digest.update(scope.encode())
    digest.update(b"|")
    digest.update((user_id or "").encode())
    digest.update(b"|")
    digest.update(key.encode())
    digest.update(b"|")
    digest.update(_canonical_body(body).encode())
    return f"idempotency:{digest.hexdigest()}"


async def _get_redis():
    """Lazy-init Redis client; cache the connection on this module."""
    global _redis, _redis_initialized
    if _redis_initialized:
        return _redis

    _redis_initialized = True
    url = settings.REDIS_URL
    if not url:
        return None
    try:
        from redis.asyncio import Redis  # type: ignore
        _redis = Redis.from_url(url, encoding="utf-8", decode_responses=True)
        # Verify connectivity early so the first cache check doesn't surprise.
        await _redis.ping()
        logger.info("Idempotency: Redis backend enabled (%s)", url)
    except Exception as exc:
        logger.warning("Idempotency: Redis unavailable (%s); falling back to in-memory.", exc)
        _redis = None
    return _redis


async def _local_get(hash_key: str) -> Optional[Any]:
    now = time.time()
    async with _local_lock:
        entry = _local_store.get(hash_key)
        if not entry:
            return None
        expires_at, payload = entry
        if expires_at < now:
            _local_store.pop(hash_key, None)
            return None
        _local_store.move_to_end(hash_key)
        return payload


async def _local_set(hash_key: str, payload: Any, ttl_seconds: int) -> None:
    expires_at = time.time() + ttl_seconds
    async with _local_lock:
        _local_store[hash_key] = (expires_at, payload)
        _local_store.move_to_end(hash_key)
        while len(_local_store) > _MAX_LOCAL_ENTRIES:
            _local_store.popitem(last=False)


async def idempotency_check(
    *,
    scope: str,
    user_id: str,
    key: Optional[str],
    body: Optional[Dict[str, Any]],
) -> Optional[Any]:
    """Return the previously-stored response for this key/body, or None."""
    hash_key = _hash_key(scope, user_id, key, body)
    if not hash_key:
        return None

    redis = await _get_redis()
    if redis is not None:
        try:
            raw = await redis.get(hash_key)
            if raw:
                return json.loads(raw)
        except Exception as exc:
            logger.warning("Idempotency: Redis GET failed (%s); falling back to local.", exc)
            return await _local_get(hash_key)
        return None

    return await _local_get(hash_key)


async def idempotency_store(
    *,
    scope: str,
    user_id: str,
    key: Optional[str],
    body: Optional[Dict[str, Any]],
    response: Any,
    ttl_seconds: int = DEFAULT_TTL_SECONDS,
) -> None:
    """Persist the response so a duplicate within `ttl_seconds` replays it."""
    hash_key = _hash_key(scope, user_id, key, body)
    if not hash_key:
        return

    try:
        payload = json.dumps(response, default=str, separators=(",", ":"))
    except (TypeError, ValueError) as exc:
        logger.warning("Idempotency: response not JSON-serializable (%s); skipping store.", exc)
        return

    redis = await _get_redis()
    if redis is not None:
        try:
            await redis.set(hash_key, payload, ex=ttl_seconds)
            return
        except Exception as exc:
            logger.warning("Idempotency: Redis SET failed (%s); falling back to local.", exc)

    await _local_set(hash_key, json.loads(payload), ttl_seconds)
