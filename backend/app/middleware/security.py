"""Security middleware for rate limiting and security headers."""
import time
from typing import Dict, Callable
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict, deque

from ..core.logging import get_logger

logger = get_logger("middleware.security")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent abuse."""
    
    def __init__(self, app, calls_per_minute: int = 60):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.clients: Dict[str, deque] = defaultdict(deque)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting per client IP."""
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries (older than 1 minute)
        while self.clients[client_ip] and current_time - self.clients[client_ip][0] > 60:
            self.clients[client_ip].popleft()
        
        # Check rate limit
        if len(self.clients[client_ip]) >= self.calls_per_minute:
            logger.warning(
                f"Rate limit exceeded for IP: {client_ip}",
                extra={
                    "client_ip": client_ip,
                    "calls_count": len(self.clients[client_ip]),
                    "limit": self.calls_per_minute,
                    "event_type": "rate_limit_exceeded"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Add current request
        self.clients[client_ip].append(current_time)
        
        # Continue with request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.calls_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, self.calls_per_minute - len(self.clients[client_ip]))
        )
        response.headers["X-RateLimit-Reset"] = str(int(current_time + 60))
        
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
