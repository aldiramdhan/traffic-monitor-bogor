import json
import redis.asyncio as aioredis
from app.config import settings


def _make_key(cctv_id: str) -> str:
    return f"traffic_analysis:{cctv_id}"


async def get_cached(client: aioredis.Redis, cctv_id: str) -> dict | None:
    raw = await client.get(_make_key(cctv_id))
    return json.loads(raw) if raw else None


async def set_cached(
    client: aioredis.Redis,
    cctv_id: str,
    data: dict,
    ttl: int = settings.redis_cache_ttl,
) -> None:
    await client.set(_make_key(cctv_id), json.dumps(data), ex=ttl)


async def invalidate(client: aioredis.Redis, cctv_id: str) -> None:
    await client.delete(_make_key(cctv_id))
