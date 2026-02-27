"""Security middleware for rate limiting and security headers."""
import time
from abc import ABC, abstractmethod
from collections import defaultdict, deque
from typing import Callable, Deque, Dict, Optional, Tuple

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger("middleware.security")


class RateLimiterBackend(ABC):
    """Abstract backend for rate limiting state storage."""

    @abstractmethod
    async def increment_and_check(
        self, key: str, max_calls: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        """Increment the counter and determine if the request is allowed.

        Returns a tuple of:
        - allowed: bool
        - remaining: int (remaining calls in the current window, >= 0)
        - reset_timestamp: int (unix timestamp when the window resets)
        """


class InMemoryRateLimiterBackend(RateLimiterBackend):
    """Simple in-memory rate limiter backend (per-process only)."""

    def __init__(self) -> None:
        self._clients: Dict[str, Deque[float]] = defaultdict(deque)

    async def increment_and_check(
        self, key: str, max_calls: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        now = time.time()
        window = self._clients[key]

        # Remove entries outside the window
        while window and now - window[0] > window_seconds:
            window.popleft()

        if len(window) >= max_calls:
            reset_timestamp = int(now + max(0, window_seconds - (now - window[0])))
            remaining = 0
            return False, remaining, reset_timestamp

        window.append(now)
        remaining = max(0, max_calls - len(window))
        reset_timestamp = int(now + window_seconds)
        return True, remaining, reset_timestamp


class RedisRateLimiterBackend(RateLimiterBackend):
    """Redis-backed rate limiter using fixed window counters.

    This backend is optional and only used when configured explicitly.
    """

    def __init__(self, redis_url: str, key_prefix: str = "rate_limit") -> None:
        try:
            from redis.asyncio import Redis  # type: ignore
        except ImportError as exc:  # pragma: no cover - configuration error path
            raise RuntimeError(
                "RedisRateLimiterBackend requires the 'redis' package. "
                "Install it with 'pip install redis'."
            ) from exc

        self._redis = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        self._prefix = key_prefix

    async def increment_and_check(
        self, key: str, max_calls: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        import math

        now = int(time.time())
        window_id = math.floor(now / window_seconds)
        redis_key = f"{self._prefix}:{key}:{window_id}"

        # Increment the counter atomically
        count = await self._redis.incr(redis_key)
        if count == 1:
            await self._redis.expire(redis_key, window_seconds)

        remaining = max(0, max_calls - count)
        reset_timestamp = (window_id + 1) * window_seconds
        allowed = count <= max_calls

        return allowed, remaining, reset_timestamp


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent abuse.

    Supports pluggable backends (in-memory, Redis) configured via settings.
    """

    def __init__(
        self,
        app,
        calls_per_minute: Optional[int] = None,
        backend: Optional[str] = None,
        window_seconds: Optional[int] = None,
        redis_url: Optional[str] = None,
    ):
        super().__init__(app)

        self.calls_per_minute = calls_per_minute or settings.RATE_LIMIT_CALLS_PER_MINUTE
        self.window_seconds = window_seconds or settings.RATE_LIMIT_WINDOW_SECONDS

        backend_name = (backend or settings.RATE_LIMIT_BACKEND).lower()
        self.backend_name = backend_name

        if backend_name == "redis":
            url = redis_url or settings.RATE_LIMIT_REDIS_URL
            if not url:
                logger.warning(
                    "RATE_LIMIT_BACKEND=redis but no RATE_LIMIT_REDIS_URL configured; "
                    "falling back to in-memory backend."
                )
                self.backend = InMemoryRateLimiterBackend()
                self.backend_name = "memory"
            else:
                try:
                    self.backend = RedisRateLimiterBackend(redis_url=url)
                except RuntimeError as exc:
                    logger.error(
                        "Failed to initialize RedisRateLimiterBackend, "
                        "falling back to in-memory backend: %s",
                        exc,
                    )
                    self.backend = InMemoryRateLimiterBackend()
                    self.backend_name = "memory"
        else:
            self.backend = InMemoryRateLimiterBackend()
            self.backend_name = "memory"

        logger.info(
            "RateLimitMiddleware initialized",
            extra={
                "backend": self.backend_name,
                "calls_per_minute": self.calls_per_minute,
                "window_seconds": self.window_seconds,
            },
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting per client IP."""
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        allowed, remaining, reset_timestamp = await self.backend.increment_and_check(
            key=client_ip,
            max_calls=self.calls_per_minute,
            window_seconds=self.window_seconds,
        )

        if not allowed:
            logger.warning(
                "Rate limit exceeded for IP: %s",
                client_ip,
                extra={
                    "client_ip": client_ip,
                    "remaining": remaining,
                    "limit": self.calls_per_minute,
                    "reset_timestamp": reset_timestamp,
                    "event_type": "rate_limit_exceeded",
                },
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.calls_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(reset_timestamp)

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy - Allow CDN resources for Swagger UI
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response
