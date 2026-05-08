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

        # Domain-specific counters / histograms.
        self.external_call_count: Counter[Tuple[str, str]] = Counter()  # (service, outcome)
        self.external_call_durations: Dict[str, List[float]] = defaultdict(list)
        self.cache_events: Counter[Tuple[str, str]] = Counter()  # (cache, hit|miss)
        self.auth_events: Counter[Tuple[str, str]] = Counter()  # (provider, outcome)
        self.circuit_events: Counter[str] = Counter()  # client_name → opens

    def record_external_call(
        self, service: str, outcome: str, duration_seconds: float
    ) -> None:
        """Record an outbound API call (gemini/spoonacular/usda)."""
        with self._lock:
            self.external_call_count[(service, outcome)] += 1
            self.external_call_durations[service].append(duration_seconds)

    def record_cache(self, cache: str, hit: bool) -> None:
        """Record a cache lookup result."""
        with self._lock:
            self.cache_events[(cache, "hit" if hit else "miss")] += 1

    def record_auth(self, provider: str, outcome: str) -> None:
        """Record auth success/failure (provider in {legacy,supabase})."""
        with self._lock:
            self.auth_events[(provider, outcome)] += 1

    def record_circuit_open(self, client_name: str) -> None:
        """Record a Gemini circuit-breaker open event."""
        with self._lock:
            self.circuit_events[client_name] += 1

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

            # External API calls
            if self.external_call_count:
                lines.append(
                    "# HELP ovi_external_calls_total Outbound API calls by service and outcome."
                )
                lines.append("# TYPE ovi_external_calls_total counter")
                for (service, outcome), count in self.external_call_count.items():
                    lines.append(
                        f'ovi_external_calls_total{{service="{service}",outcome="{outcome}"}} {count}'
                    )

            if self.external_call_durations:
                lines.append(
                    "# HELP ovi_external_call_duration_seconds Outbound API latency."
                )
                lines.append("# TYPE ovi_external_call_duration_seconds summary")
                for service, times in self.external_call_durations.items():
                    if not times:
                        continue
                    sorted_times = sorted(times)
                    lines.append(
                        f'ovi_external_call_duration_seconds_sum{{service="{service}"}} {sum(sorted_times)}'
                    )
                    lines.append(
                        f'ovi_external_call_duration_seconds_count{{service="{service}"}} {len(sorted_times)}'
                    )

            # Cache hit/miss
            if self.cache_events:
                lines.append("# HELP ovi_cache_events_total Cache hits / misses.")
                lines.append("# TYPE ovi_cache_events_total counter")
                for (cache, outcome), count in self.cache_events.items():
                    lines.append(
                        f'ovi_cache_events_total{{cache="{cache}",outcome="{outcome}"}} {count}'
                    )

            # Auth events
            if self.auth_events:
                lines.append("# HELP ovi_auth_events_total Auth verification outcomes.")
                lines.append("# TYPE ovi_auth_events_total counter")
                for (provider, outcome), count in self.auth_events.items():
                    lines.append(
                        f'ovi_auth_events_total{{provider="{provider}",outcome="{outcome}"}} {count}'
                    )

            # Circuit breaker opens
            if self.circuit_events:
                lines.append("# HELP ovi_circuit_open_total Gemini circuit-breaker opens.")
                lines.append("# TYPE ovi_circuit_open_total counter")
                for client_name, count in self.circuit_events.items():
                    lines.append(
                        f'ovi_circuit_open_total{{client="{client_name}"}} {count}'
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
            self.external_call_count.clear()
            self.external_call_durations.clear()
            self.cache_events.clear()
            self.auth_events.clear()
            self.circuit_events.clear()


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
