import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis_client
from app.schemas.health import HealthResponse, ServiceStatus

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="System Health Check")
async def health_check() -> HealthResponse:
    """
    Comprehensive system health diagnostic check.
    Pings the API service, PostgreSQL database, and Redis broker.
    """
    services = {}
    overall_status = "healthy"

    # 1. API Health
    services["api"] = ServiceStatus(
        status="healthy",
        response_time_ms=0.1,
        details="CodeArena API is operating normally"
    )

    # 2. Database Health
    t0 = time.perf_counter()
    try:
        from app.core.database import async_session_maker
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        db_ms = round((time.perf_counter() - t0) * 1000, 2)
        services["database"] = ServiceStatus(
            status="healthy",
            response_time_ms=db_ms,
            details=f"PostgreSQL connection verified ({settings.POSTGRES_DB})"
        )
    except Exception as e:
        db_ms = round((time.perf_counter() - t0) * 1000, 2)
        services["database"] = ServiceStatus(
            status="unhealthy",
            response_time_ms=db_ms,
            details=f"Database connection failed: {str(e)[:120]}"
        )
        overall_status = "degraded"

    # 3. Redis Health
    t0 = time.perf_counter()
    try:
        redis = await get_redis_client()
        pong = await redis.ping()
        redis_ms = round((time.perf_counter() - t0) * 1000, 2)
        if pong:
            services["redis"] = ServiceStatus(
                status="healthy",
                response_time_ms=redis_ms,
                details="Redis broker responsive"
            )
        else:
            services["redis"] = ServiceStatus(
                status="degraded",
                response_time_ms=redis_ms,
                details="Redis ping returned non-True response"
            )
            overall_status = "degraded"
    except Exception as e:
        redis_ms = round((time.perf_counter() - t0) * 1000, 2)
        services["redis"] = ServiceStatus(
            status="unhealthy",
            response_time_ms=redis_ms,
            details=f"Redis connection failed: {str(e)[:120]}"
        )
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        services=services
    )
