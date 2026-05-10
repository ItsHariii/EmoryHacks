import asyncio
import logging
import math
import time
from typing import Any, Callable, Dict, Optional, Tuple
from collections import defaultdict, deque
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Per-service sliding-window rate limiter.

    Limits are sourced from settings.EXTERNAL_RATE_LIMITS as
    (max_calls, window_seconds) tuples. Backends:
        - "memory" (default): per-process in-memory deque.
        - "redis": fixed-window INCR/EXPIRE for cross-process correctness.

    The Redis path matches RedisRateLimiterBackend in middleware/security.py.
    """

    def __init__(
        self,
        backend: Optional[str] = None,
        redis_url: Optional[str] = None,
    ) -> None:
        self.limits: Dict[str, Tuple[int, int]] = dict(settings.EXTERNAL_RATE_LIMITS)
        self.request_times: Dict[str, deque] = defaultdict(lambda: deque())
        self.locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

        backend_name = (backend or settings.RATE_LIMIT_BACKEND or "memory").lower()
        self._redis = None
        if backend_name == "redis":
            url = redis_url or settings.RATE_LIMIT_REDIS_URL
            if not url:
                logger.warning(
                    "Service RateLimiter: redis backend requested but no "
                    "RATE_LIMIT_REDIS_URL set; falling back to memory."
                )
                backend_name = "memory"
            else:
                try:
                    from redis.asyncio import Redis  # type: ignore

                    self._redis = Redis.from_url(
                        url, encoding="utf-8", decode_responses=True
                    )
                except ImportError as exc:
                    logger.error(
                        "Service RateLimiter: redis package missing (%s); "
                        "falling back to memory.",
                        exc,
                    )
                    backend_name = "memory"

        self.backend_name = backend_name

    def _limit_for(self, service: str) -> Tuple[int, int]:
        return self.limits.get(service) or self.limits.get("default", (60, 60))

    async def acquire(self, service: str = "default") -> bool:
        """Try to consume a slot in the current window. False if rate-limited."""
        max_calls, window = self._limit_for(service)

        if self._redis is not None:
            now = int(time.time())
            window_id = math.floor(now / window)
            key = f"rate_limit:service:{service}:{window_id}"
            count = await self._redis.incr(key)
            if count == 1:
                await self._redis.expire(key, window)
            return count <= max_calls

        async with self.locks[service]:
            now = time.time()
            window_start = now - window
            bucket = self.request_times[service]
            while bucket and bucket[0] < window_start:
                bucket.popleft()
            if len(bucket) < max_calls:
                bucket.append(now)
                return True
            return False

    async def wait_for_slot(self, service: str = "default", max_wait: int = 300) -> bool:
        """Block until a slot frees up or max_wait elapses."""
        max_calls, window = self._limit_for(service)
        deadline = time.time() + max_wait

        while time.time() < deadline:
            if await self.acquire(service):
                return True

            if self._redis is not None:
                # Fixed-window: wait until end of current window before retrying.
                now = time.time()
                window_id = math.floor(now / window)
                next_reset = (window_id + 1) * window
                await asyncio.sleep(min(max(1.0, next_reset - now), 10.0))
                continue

            async with self.locks[service]:
                bucket = self.request_times[service]
                if bucket:
                    oldest = bucket[0]
                    wait_time = max(1.0, oldest + window - time.time())
                    await asyncio.sleep(min(wait_time, 10.0))
                else:
                    await asyncio.sleep(1.0)

        return False

    def get_remaining_requests(self, service: str = "default") -> int:
        max_calls, window = self._limit_for(service)
        if self._redis is not None:
            # Redis count is best-effort here; fixed-window means precise count
            # requires an extra GET. Skip for now.
            return max_calls
        now = time.time()
        window_start = now - window
        bucket = self.request_times[service]
        current = sum(1 for t in bucket if t >= window_start)
        return max(0, max_calls - current)

    def reset_service(self, service: str) -> None:
        """Clear in-memory bucket for a service. No-op for Redis backend."""
        self.request_times[service].clear()

class RetryHandler:
    """
    Handles retries with exponential backoff and different strategies.
    """
    
    def __init__(self):
        self.max_retries = 1
        self.base_delay = 1.0
        self.max_delay = 60.0
        self.backoff_factor = 2.0
    
    async def retry_with_backoff(
        self,
        func: Callable,
        *args,
        max_retries: Optional[int] = None,
        retry_on: tuple = (httpx.HTTPStatusError, httpx.RequestError),
        **kwargs
    ) -> Any:
        """
        Retry a function with exponential backoff.
        
        Args:
            func: Async function to retry
            max_retries: Maximum number of retries (default: 3)
            retry_on: Tuple of exceptions to retry on
            *args, **kwargs: Arguments to pass to func
            
        Returns:
            Result of successful function call
            
        Raises:
            Last exception if all retries fail
        """
        max_retries = max_retries or self.max_retries
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return await func(*args, **kwargs)
            
            except retry_on as e:
                last_exception = e
                
                if attempt == max_retries:
                    logger.error(f"All {max_retries} retries failed for {func.__name__}: {e}")
                    raise e
                
                # Calculate delay with exponential backoff
                delay = min(
                    self.base_delay * (self.backoff_factor ** attempt),
                    self.max_delay
                )
                
                # Add jitter to prevent thundering herd
                jitter = delay * 0.1 * (0.5 - asyncio.get_event_loop().time() % 1)
                total_delay = delay + jitter
                
                logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}. Retrying in {total_delay:.2f}s")
                await asyncio.sleep(total_delay)
            
            except Exception as e:
                # Don't retry on unexpected exceptions
                logger.error(f"Non-retryable error in {func.__name__}: {e}")
                raise e
        
        # This should never be reached, but just in case
        raise last_exception

class APIClientWithLimiting:
    """
    HTTP client wrapper with rate limiting and retry logic.
    """

    def __init__(
        self,
        service_name: str = "default",
        rate_limiter: Optional["RateLimiter"] = None,
        retry_handler: Optional["RetryHandler"] = None,
    ):
        self.service_name = service_name
        self.rate_limiter = rate_limiter or _shared_rate_limiter
        self.retry_handler = retry_handler or _shared_retry_handler
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get(self, url: str, **kwargs) -> httpx.Response:
        """Make a GET request with rate limiting and retries."""
        return await self._make_request("GET", url, **kwargs)
    
    async def post(self, url: str, **kwargs) -> httpx.Response:
        """Make a POST request with rate limiting and retries."""
        return await self._make_request("POST", url, **kwargs)
    
    async def _make_request(self, method: str, url: str, **kwargs) -> httpx.Response:
        """Internal method to make HTTP requests with rate limiting and retries."""

        async def _request():
            from app.middleware.metrics import metrics_collector

            if not await self.rate_limiter.wait_for_slot(self.service_name):
                metrics_collector.record_external_call(
                    self.service_name, "rate_limited", 0.0
                )
                raise httpx.RequestError(f"Rate limit timeout for {self.service_name}")

            start = time.time()
            try:
                response = await self.client.request(method, url, **kwargs)
            except Exception:
                metrics_collector.record_external_call(
                    self.service_name, "error", time.time() - start
                )
                raise

            duration = time.time() - start

            if response.status_code == 429:
                logger.warning(f"Rate limited by {self.service_name} API")
                metrics_collector.record_external_call(
                    self.service_name, "rate_limited", duration
                )
                raise httpx.HTTPStatusError(
                    f"Rate limited by {self.service_name}",
                    request=response.request,
                    response=response,
                )

            try:
                response.raise_for_status()
            except httpx.HTTPStatusError:
                metrics_collector.record_external_call(
                    self.service_name, f"http_{response.status_code}", duration
                )
                raise

            metrics_collector.record_external_call(self.service_name, "ok", duration)
            return response

        return await self.retry_handler.retry_with_backoff(_request)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    def get_rate_limit_status(self) -> Dict[str, Any]:
        max_calls, window_seconds = self.rate_limiter._limit_for(self.service_name)
        return {
            "service": self.service_name,
            "remaining_requests": self.rate_limiter.get_remaining_requests(self.service_name),
            "max_calls": max_calls,
            "window_seconds": window_seconds,
            "backend": self.rate_limiter.backend_name,
        }


# Module-level singletons. APIClientWithLimiting instances reuse these so all
# callers share the same limit state (critical for the Redis backend; also
# avoids duplicate in-memory buckets per client).
_shared_rate_limiter = RateLimiter()
_shared_retry_handler = RetryHandler()

spoonacular_client = APIClientWithLimiting("spoonacular")
usda_client = APIClientWithLimiting("usda")
off_client = APIClientWithLimiting("open_food_facts")
default_client = APIClientWithLimiting("default")

rate_limiter = _shared_rate_limiter
retry_handler = _shared_retry_handler
