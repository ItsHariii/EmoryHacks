"""Logging middleware for request/response tracking."""
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.logging import get_logger

logger = get_logger("middleware.logging")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        # Generate request ID if not present
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Extract request details
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Log request
        logger.info(
            f"Request started: {method} {url}",
            extra={
                "request_id": request_id,
                "method": method,
                "url": url,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "event_type": "request_started"
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed: {method} {url} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "url": url,
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "event_type": "request_completed"
                }
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as exc:
            # Calculate duration
            duration = time.time() - start_time
            
            # Log error
            logger.error(
                f"Request failed: {method} {url} - {type(exc).__name__}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "url": url,
                    "error": str(exc),
                    "error_type": type(exc).__name__,
                    "duration_ms": round(duration * 1000, 2),
                    "event_type": "request_failed"
                },
                exc_info=True
            )
            
            # Re-raise the exception
            raise
