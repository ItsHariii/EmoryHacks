"""Health check endpoints for monitoring and load balancers."""
from fastapi import APIRouter, status, HTTPException
from sqlalchemy import text
from typing import Dict, Any
import time
import httpx

from ..core.database import engine
from ..core.config import settings
from ..core.logging import get_logger

router = APIRouter()
logger = get_logger("api.health")


@router.get("/", tags=["Health"])
async def basic_health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "timestamp": time.time()}


@router.get("/detailed", tags=["Health"])
async def detailed_health_check():
    """Detailed health check including dependencies."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "checks": {}
    }
    
    overall_healthy = True
    
    # Database health check
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            if result.scalar() == 1:
                health_status["checks"]["database"] = {
                    "status": "healthy",
                    "response_time_ms": 0  # Could add timing here
                }
            else:
                health_status["checks"]["database"] = {
                    "status": "unhealthy",
                    "error": "Query returned unexpected result"
                }
                overall_healthy = False
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
        logger.error(f"Database health check failed: {e}")
    
    # External API health checks
    external_apis = [
        ("spoonacular", "https://api.spoonacular.com/"),
        ("usda", "https://api.nal.usda.gov/fdc/v1/")
    ]
    
    for api_name, api_url in external_apis:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                start_time = time.time()
                response = await client.get(api_url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code < 500:  # Accept 4xx as "healthy" (API is responding)
                    health_status["checks"][api_name] = {
                        "status": "healthy",
                        "response_time_ms": round(response_time, 2)
                    }
                else:
                    health_status["checks"][api_name] = {
                        "status": "degraded",
                        "response_time_ms": round(response_time, 2),
                        "status_code": response.status_code
                    }
        except Exception as e:
            health_status["checks"][api_name] = {
                "status": "unhealthy",
                "error": str(e)
            }
            logger.warning(f"{api_name} API health check failed: {e}")
    
    # Set overall status
    if not overall_healthy:
        health_status["status"] = "unhealthy"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status


@router.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check for Kubernetes."""
    try:
        # Check database connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "not ready", "error": str(e)}
        )


@router.get("/live", tags=["Health"])
async def liveness_check():
    """Liveness check for Kubernetes."""
    return {"status": "alive", "timestamp": time.time()}
