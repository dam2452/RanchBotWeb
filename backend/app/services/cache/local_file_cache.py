import os

import aiofiles

from app.core.logger import setup_logger

logger = setup_logger(__name__)


class LocalFileCacheManager:
    def __init__(self, cache_dir: str, extension: str) -> None:
        self._cache_dir = cache_dir
        self._extension = extension
        os.makedirs(cache_dir, exist_ok=True)

    def _cache_path(self, key: str) -> str:
        safe_key = key.replace("/", "_").replace("..", "_")
        return os.path.join(self._cache_dir, f"{safe_key}{self._extension}")

    async def get(self, key: str) -> bytes | None:
        path = self._cache_path(key)
        if not os.path.exists(path):
            return None
        try:
            async with aiofiles.open(path, "rb") as f:
                return await f.read()
        except Exception as e:
            logger.error(f"Cache read error [{key}]: {e}")
            return None

    async def put(self, key: str, data: bytes) -> None:
        path = self._cache_path(key)
        try:
            async with aiofiles.open(path, "wb") as f:
                await f.write(data)
        except Exception as e:
            logger.error(f"Cache write error [{key}]: {e}")

    def exists(self, key: str) -> bool:
        return os.path.exists(self._cache_path(key))
