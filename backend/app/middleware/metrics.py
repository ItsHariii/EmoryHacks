"""Metrics collection middleware for monitoring."""
import threading
import time
from collections import Counter, defaultdict
from typing import Any, Callable, Dict, List, Tuple

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger("middleware.metrics")


class MetricsCollector:
    """Simple in-memory metrics collector."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.request_count = Counter()
        self.response_times = defaultdict(list)
        self.status_codes = Counter()
        self.errors = Counter()
        self.active_requests = 0

        # Label-based metrics: (method, path, status_code, environment)
        self.request_count_by_label: Counter[
            Tuple[str, str, int, str]
        ] = Counter()
        self.response_times_by_label: Dict[
            Tuple[str, str, int, str], List[float]
        ] = defaultdict(list)

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration: float,
        error: Any = None,
    ) -> None:
        """Record request metrics."""
        env = str(settings.ENVIRONMENT)
        label = (method, path, int(status_code), env)

        with self._lock:
            # Backwards-compatible aggregates
            key = f"{method}:{path}"
            self.request_count[key] += 1
            self.response_times[key].append(duration)
            self.status_codes[status_code] += 1

            if error:
                self.errors[error] += 1

            # Label-based aggregates
            self.request_count_by_label[label] += 1
            self.response_times_by_label[label].append(duration)

    def increment_active_requests(self) -> None:
        """Increment active request counter."""
        with self._lock:
            self.active_requests += 1

    def decrement_active_requests(self) -> None:
        """Decrement active request counter."""
        with self._lock:
            self.active_requests = max(0, self.active_requests - 1)

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot (JSON-friendly structure)."""
        with self._lock:
            # Calculate response time percentiles
            response_time_stats: Dict[str, Dict[str, float]] = {}
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

            # Label-based stats
            label_metrics: Dict[str, Dict[str, Any]] = {}
            for (method, path, status, env), times in self.response_times_by_label.items():
                key = f"{method} {path} {status} {env}"
                if times:
                    sorted_times = sorted(times)
                    count = len(sorted_times)
                    label_metrics[key] = {
                        "method": method,
                        "path": path,
                        "status_code": status,
                        "environment": env,
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
                "environment": str(settings.ENVIRONMENT),
                "active_requests": self.active_requests,
                "total_requests": sum(self.request_count.values()),
                "request_count_by_endpoint": dict(self.request_count),
                "status_codes": dict(self.status_codes),
                "errors": dict(self.errors),
                "response_times": response_time_stats,
                "request_metrics_by_label": label_metrics,
            }

    def get_prometheus_metrics(self) -> str:
        """Render metrics in Prometheus text exposition format."""
        lines: List[str] = []

        with self._lock:
            env_default = str(settings.ENVIRONMENT)

            # Request counts
            lines.append(
                "# HELP ovi_requests_total Total HTTP requests processed by the Ovi API."
            )
            lines.append("# TYPE ovi_requests_total counter")
            for (method, path, status, env), count in self.request_count_by_label.items():
                environment = env or env_default
                lines.append(
                    'ovi_requests_total{method="%s",path="%s",status="%s",environment="%s"} %d'
                    % (method, path, status, environment, count)
                )

            # Request duration (seconds)
            lines.append(
                "# HELP ovi_request_duration_seconds HTTP request duration in seconds."
            )
            lines.append("# TYPE ovi_request_duration_seconds summary")
            for (method, path, status, env), times in self.response_times_by_label.items():
                if not times:
                    continue
                environment = env or env_default
                sorted_times = sorted(times)
                count = float(len(sorted_times))
                total = float(sum(sorted_times))

                # Sum and count
                base_labels = (
                    f'method="{method}",path="{path}",status="{status}",environment="{environment}"'
                )
                lines.append(
                    f"ovi_request_duration_seconds_sum{{{base_labels}}} {total}"
                )
                lines.append(
                    f"ovi_request_duration_seconds_count{{{base_labels}}} {int(count)}"
                )

                # Quantiles
                def quantile(q: float) -> float:
                    if not sorted_times:
                        return 0.0
                    index = int(q * (len(sorted_times) - 1))
                    return float(sorted_times[index])

                for q, q_label in [(0.5, "0.5"), (0.95, "0.95"), (0.99, "0.99")]:
                    value = quantile(q)
                    lines.append(
                        f'ovi_request_duration_seconds{{{base_labels},quantile="{q_label}"}} {value}'
                    )

            # Active requests gauge
            lines.append(
                "# HELP ovi_active_requests Number of in-flight HTTP requests being served."
            )
            lines.append("# TYPE ovi_active_requests gauge")
            lines.append(
                f'ovi_active_requests{{environment="{env_default}"}} {self.active_requests}'
            )

        return "\n".join(lines) + "\n"

    def reset_metrics(self) -> None:
        """Reset all metrics."""
        with self._lock:
            self.request_count.clear()
            self.response_times.clear()
            self.status_codes.clear()
            self.errors.clear()
            self.active_requests = 0
            self.request_count_by_label.clear()
            self.response_times_by_label.clear()


# Global metrics collector instance
metrics_collector = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting request metrics."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Collect metrics for each request."""
        # Skip metrics collection for metrics endpoints themselves
        if request.url.path in ("/metrics", "/metrics/prometheus"):
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
                duration=duration,
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
                error=type(exc).__name__,
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
            r"/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
            "/{id}",
            path,
            flags=re.IGNORECASE,
        )

        # Replace numeric IDs
        path = re.sub(r"/\d+", "/{id}", path)

        return path
