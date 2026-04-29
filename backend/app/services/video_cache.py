import asyncio
import time
from collections import OrderedDict
from typing import Awaitable, Callable, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__)


class VideoStreamCache:
    def __init__(self, max_entries: int, ttl_seconds: int) -> None:
        self._max_entries = max_entries
        self._ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, Dict[str, object]] = OrderedDict()
        self._lock = asyncio.Lock()
        self._pending: Dict[str, asyncio.Event] = {}

    async def get(self, position_id: str) -> Optional[bytes]:
        async with self._lock:
            entry = self._cache.get(position_id)
            if entry is None:
                return None
            if time.monotonic() - entry["fetched_at"] > self._ttl_seconds:
                del self._cache[position_id]
                return None
            self._cache.move_to_end(position_id)
            return entry["data"]

    async def put(self, position_id: str, data: bytes) -> None:
        async with self._lock:
            self._cache[position_id] = {"data": data, "fetched_at": time.monotonic()}
            self._cache.move_to_end(position_id)
            while len(self._cache) > self._max_entries:
                evicted_key, _ = self._cache.popitem(last=False)
                logger.debug(f"Evicted cache entry: {evicted_key}")

    async def get_or_fetch(
        self,
        position_id: str,
        fetcher: Callable[[], Awaitable[bytes]],
    ) -> bytes:
        cached = await self.get(position_id)
        if cached is not None:
            return cached

        async with self._lock:
            if position_id in self._pending:
                event = self._pending[position_id]
            else:
                event = asyncio.Event()
                self._pending[position_id] = event

        if event.is_set():
            return await self.get(position_id) or await self._fetch_and_store(position_id, fetcher)

        try:
            data = await self._fetch_and_store(position_id, fetcher)
            return data
        finally:
            async with self._lock:
                self._pending.pop(position_id, None)
                event.set()

    async def _fetch_and_store(
        self,
        position_id: str,
        fetcher: Callable[[], Awaitable[bytes]],
    ) -> bytes:
        data = await fetcher()
        await self.put(position_id, data)
        logger.info(f"Cached video for position {position_id} ({len(data)} bytes)")
        return data

    def invalidate(self, position_id: str) -> None:
        self._cache.pop(position_id, None)

    async def clear(self) -> None:
        async with self._lock:
            self._cache.clear()
            logger.info("Video stream cache cleared")

    async def stats(self) -> Tuple[int, int, List[str]]:
        async with self._lock:
            now = time.monotonic()
            active = sum(
                1 for entry in self._cache.values()
                if now - entry["fetched_at"] <= self._ttl_seconds
            )
            return active, len(self._cache), list(self._cache.keys())


video_cache = VideoStreamCache(
    max_entries=settings.video_stream_cache_max_entries,
    ttl_seconds=settings.video_stream_cache_ttl_seconds,
)
