"""Metrics collection middleware for monitoring."""
import time
from typing import Callable, Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict, Counter
import threading

from ..core.logging import get_logger

logger = get_logger("middleware.metrics")


class MetricsCollector:
    """Simple in-memory metrics collector."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self.request_count = Counter()
        self.response_times = defaultdict(list)
        self.status_codes = Counter()
        self.errors = Counter()
        self.active_requests = 0
    
    def record_request(self, method: str, path: str, status_code: int, duration: float, error: str = None):
        """Record request metrics."""
        with self._lock:
            self.request_count[f"{method}:{path}"] += 1
            self.response_times[f"{method}:{path}"].append(duration)
            self.status_codes[status_code] += 1
            
            if error:
                self.errors[error] += 1
    
    def increment_active_requests(self):
        """Increment active request counter."""
        with self._lock:
            self.active_requests += 1
    
    def decrement_active_requests(self):
        """Decrement active request counter."""
        with self._lock:
            self.active_requests = max(0, self.active_requests - 1)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot."""
        with self._lock:
            # Calculate response time percentiles
            response_time_stats = {}
            for endpoint, times in self.response_times.items():
                if times:
                    sorted_times = sorted(times)
                    count = len(sorted_times)
                    response_time_stats[endpoint] = {
                        "count": count,
                        "avg": sum(sorted_times) / count,
                        "min": min(sorted_times),
                        "max": max(sorted_times),
                        "p50": sorted_times[int(count * 0.5)] if count > 0 else 0,
                        "p95": sorted_times[int(count * 0.95)] if count > 0 else 0,
                        "p99": sorted_times[int(count * 0.99)] if count > 0 else 0,
                    }
            
            return {
                "timestamp": time.time(),
                "active_requests": self.active_requests,
                "total_requests": sum(self.request_count.values()),
                "request_count_by_endpoint": dict(self.request_count),
                "status_codes": dict(self.status_codes),
                "errors": dict(self.errors),
                "response_times": response_time_stats
            }
    
    def reset_metrics(self):
        """Reset all metrics."""
        with self._lock:
            self.request_count.clear()
            self.response_times.clear()
            self.status_codes.clear()
            self.errors.clear()
            self.active_requests = 0


# Global metrics collector instance
metrics_collector = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting request metrics."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Collect metrics for each request."""
        # Skip metrics collection for metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)
        
        # Extract request details
        method = request.method
        path = request.url.path
        
        # Normalize path for metrics (remove IDs)
        normalized_path = self._normalize_path(path)
        
        # Start timing and increment active requests
        start_time = time.time()
        metrics_collector.increment_active_requests()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Record metrics
            metrics_collector.record_request(
                method=method,
                path=normalized_path,
                status_code=response.status_code,
                duration=duration
            )
            
            # Add metrics headers
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            
            return response
            
        except Exception as exc:
            # Calculate duration
            duration = time.time() - start_time
            
            # Record error metrics
            metrics_collector.record_request(
                method=method,
                path=normalized_path,
                status_code=500,
                duration=duration,
                error=type(exc).__name__
            )
            
            # Re-raise the exception
            raise
            
        finally:
            # Decrement active requests
            metrics_collector.decrement_active_requests()
    
    def _normalize_path(self, path: str) -> str:
        """Normalize path by replacing UUIDs and IDs with placeholders."""
        import re
        
        # Replace UUIDs
        path = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{id}',
            path,
            flags=re.IGNORECASE
        )
        
        # Replace numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        
        return path
