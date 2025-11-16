from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
import uuid
import os
from pathlib import Path
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from app.core.config import settings
from .api import auth, health, journal, users
from .api.food import router as food_router
from app.core.logging import logger
from app.middleware.logging import LoggingMiddleware
from app.middleware.security import RateLimitMiddleware, SecurityHeadersMiddleware
from app.middleware.metrics import MetricsMiddleware, metrics_collector

# ======================================================
# Lifespan - Handles app startup and shutdown events
# ======================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Ovi API Server")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # ✅ Add DB connections, model preloading, etc. here if needed
    yield

    logger.info("🛑 Shutting down Ovi API Server")
    # ✅ Add cleanup tasks here


# ======================================================
# FastAPI App Initialization
# ======================================================
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    # Ovi Pregnancy Nutrition & Wellness API
    
    A comprehensive backend API for pregnancy nutrition tracking and food safety analysis.
    
    ## Features
    
    * **Food Safety Analysis**: Check if foods are safe during pregnancy
    * **Nutrition Tracking**: Log and track daily nutrition intake
    * **User Management**: Secure user authentication and profile management
    * **External API Integration**: Spoonacular and USDA food databases
    * **Health Monitoring**: Built-in health checks and metrics
    
    ## Authentication
    
    Most endpoints require Bearer token authentication. Use the `/auth/login` endpoint to obtain a token.
    
    ## Rate Limiting
    
    API requests are limited to 100 requests per minute per IP address.
    """,
    version=settings.VERSION,
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL,
    root_path="",
    lifespan=lifespan,
    contact={
        "name": "Ovi API Support",
        "email": "support@ovi.app",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    tags_metadata=[
        {
            "name": "Authentication",
            "description": "User authentication and authorization endpoints",
        },
        {
            "name": "Users",
            "description": "User profile management and preferences",
        },
        {
            "name": "Food",
            "description": "Food search, safety analysis, and nutrition information",
        },
        {
            "name": "Food Logs",
            "description": "Daily food intake logging and tracking",
        },
        {
            "name": "Nutrition",
            "description": "Nutrition analysis and recommendations",
        },
        {
            "name": "Health",
            "description": "System health checks and monitoring",
        },
        {
            "name": "Monitoring",
            "description": "Application metrics and observability",
        },
        {
            "name": "Journal",
            "description": "Journal and mood tracking for pregnancy wellness",
        },
    ],
)

# ======================================================
# Middleware
# ======================================================

# ----- Security Middleware -----
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, calls_per_minute=100)

# ----- Metrics Middleware -----
app.add_middleware(MetricsMiddleware)

# ----- Logging Middleware -----
app.add_middleware(LoggingMiddleware)

# ----- CORS -----
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# ----- Docs Redirect Middleware -----
class ProcessRequestMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.url.path == "/docs" and not str(request.url).endswith("/docs"):
            return RedirectResponse(url=str(request.url) + "/")
        return await call_next(request)

app.add_middleware(ProcessRequestMiddleware)

# ----- Normalize Trailing Slashes -----
@app.middleware("http")
async def normalize_path_middleware(request: Request, call_next):
    # Skip for root, docs, and static files
    if (
        request.url.path == "/" or
        request.url.path.startswith("/docs") or
        '.' in request.url.path.split('/')[-1]
    ):
        return await call_next(request)

    # Remove trailing slash if present
    if request.url.path.endswith("/"):
        return RedirectResponse(url=str(request.url).rstrip("/"), status_code=301)

    return await call_next(request)

# ----- Request ID Middleware -----
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# ----- Security Headers -----
# ✅ Only enable HTTPS redirect in production
if settings.SECURE_HEADERS and settings.ENVIRONMENT == "production":
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
    from fastapi.middleware.trustedhost import TrustedHostMiddleware

    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS
    )

# ======================================================
# Exception Handlers
# ======================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors."""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "request_id": request.state.request_id,
        },
    )

@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: Exception):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": "The requested resource was not found",
            "request_id": request.state.request_id,
        },
    )

# ======================================================
# API Routes
# ======================================================
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(food_router, prefix="/food")
app.include_router(journal.router, prefix="/journal", tags=["Journal"])

# ======================================================
# Root Endpoint
# ======================================================
@app.get("/", tags=["Root"])
async def root(request: Request):
    """Root endpoint with basic API information."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": str(request.url) + "docs" if settings.DOCS_URL else None,
        "request_id": request.state.request_id,
    }

# ======================================================
# Metrics Endpoint
# ======================================================
@app.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """Get application metrics for monitoring."""
    return metrics_collector.get_metrics()

# ======================================================
# Health Check Endpoint
# ======================================================
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {"status": "healthy"}

# ======================================================
# Main Entry Point
# ======================================================
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG,
    )
