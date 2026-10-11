import time
from typing import Dict, List
from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.core.redis import get_redis_client

# In-memory fallback if Redis is unavailable
_memory_limiter_store: Dict[str, List[float]] = {}


async def check_auth_rate_limit(request: Request, limit: int = 30, window_seconds: int = 60) -> None:
    """
    Sliding window rate limiter for auth endpoints.
    Uses Redis when available, falls back to in-memory sliding window.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:auth:{client_ip}"
    now = time.time()

    # Try Redis first
    try:
        redis = await get_redis_client()
        pipe = redis.pipeline()
        # Remove timestamps older than window
        pipe.zremrangebyscore(key, 0, now - window_seconds)
        # Count remaining timestamps in window
        pipe.zcard(key)
        # Add current timestamp
        pipe.zadd(key, {str(now): now})
        # Set expire
        pipe.expire(key, window_seconds + 5)
        results = await pipe.execute()
        current_count = results[1]

        if current_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Please try again later.",
            )
        return
    except HTTPException:
        raise
    except Exception:
        # Fallback to in-memory store
        timestamps = _memory_limiter_store.get(key, [])
        cutoff = now - window_seconds
        timestamps = [t for t in timestamps if t > cutoff]
        if len(timestamps) >= limit:
            _memory_limiter_store[key] = timestamps
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Please try again later.",
            )
        timestamps.append(now)
        _memory_limiter_store[key] = timestamps
