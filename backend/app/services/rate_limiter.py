import asyncio
import logging
import time
from typing import Dict, Optional, Callable, Any
from datetime import datetime, timedelta
from collections import defaultdict, deque
import httpx

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Rate limiter for API calls with sliding window algorithm.
    Supports different limits for different services.
    """
    
    def __init__(self):
        # Rate limits per service (requests per minute)
        self.limits = {
            "spoonacular": 150,  # Spoonacular allows 150 requests/day on free tier
            "usda": 1000,        # USDA allows 1000 requests/hour
            "default": 60        # Default conservative limit
        }
        
        # Sliding window tracking
        self.request_times: Dict[str, deque] = defaultdict(lambda: deque())
        self.locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
    
    async def acquire(self, service: str = "default") -> bool:
        """
        Acquire permission to make an API call.
        Returns True if allowed, False if rate limited.
        """
        async with self.locks[service]:
            now = time.time()
            window_start = now - 60  # 1-minute sliding window
            
            # Remove old requests outside the window
            while self.request_times[service] and self.request_times[service][0] < window_start:
                self.request_times[service].popleft()
            
            # Check if we're under the limit
            current_requests = len(self.request_times[service])
            limit = self.limits.get(service, self.limits["default"])
            
            if current_requests < limit:
                self.request_times[service].append(now)
                return True
            
            return False
    
    async def wait_for_slot(self, service: str = "default", max_wait: int = 300) -> bool:
        """
        Wait for an available slot in the rate limit.
        Returns True if slot acquired, False if timeout.
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            if await self.acquire(service):
                return True
            
            # Calculate wait time until next slot is available
            async with self.locks[service]:
                if self.request_times[service]:
                    oldest_request = self.request_times[service][0]
                    wait_time = max(1, oldest_request + 60 - time.time())
                    await asyncio.sleep(min(wait_time, 10))  # Wait max 10 seconds at a time
                else:
                    await asyncio.sleep(1)
        
        return False
    
    def get_remaining_requests(self, service: str = "default") -> int:
        """Get number of remaining requests in current window."""
        now = time.time()
        window_start = now - 60
        
        # Count requests in current window
        current_requests = sum(1 for req_time in self.request_times[service] if req_time >= window_start)
        limit = self.limits.get(service, self.limits["default"])
        
        return max(0, limit - current_requests)
    
    def reset_service(self, service: str):
        """Reset rate limiting for a specific service."""
        with self.locks[service]:
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
    
    def __init__(self, service_name: str = "default"):
        self.service_name = service_name
        self.rate_limiter = RateLimiter()
        self.retry_handler = RetryHandler()
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
            # Wait for rate limit slot
            if not await self.rate_limiter.wait_for_slot(self.service_name):
                raise httpx.RequestError(f"Rate limit timeout for {self.service_name}")
            
            # Make the request
            response = await self.client.request(method, url, **kwargs)
            
            # Handle specific HTTP status codes
            if response.status_code == 429:  # Too Many Requests
                logger.warning(f"Rate limited by {self.service_name} API")
                raise httpx.HTTPStatusError(
                    f"Rate limited by {self.service_name}",
                    request=response.request,
                    response=response
                )
            
            response.raise_for_status()
            return response
        
        # Retry with backoff
        return await self.retry_handler.retry_with_backoff(_request)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status."""
        return {
            "service": self.service_name,
            "remaining_requests": self.rate_limiter.get_remaining_requests(self.service_name),
            "limit": self.rate_limiter.limits.get(self.service_name, self.rate_limiter.limits["default"])
        }

# Global instances for different services
spoonacular_client = APIClientWithLimiting("spoonacular")
usda_client = APIClientWithLimiting("usda")
default_client = APIClientWithLimiting("default")

# Singleton rate limiter and retry handler
rate_limiter = RateLimiter()
retry_handler = RetryHandler()
