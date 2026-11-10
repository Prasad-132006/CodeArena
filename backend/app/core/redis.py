from typing import AsyncGenerator
import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.core.config import settings

redis_client: Redis | None = None


async def get_redis_client() -> Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5.0,
            socket_timeout=None,
        )
    return redis_client


async def close_redis_client() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


async def get_redis() -> AsyncGenerator[Redis, None]:
    client = await get_redis_client()
    yield client
