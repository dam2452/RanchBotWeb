import hashlib
import json
import os
from typing import Optional

import aiofiles

from app.core.config import settings
from app.core.logger import setup_logger
from app.services.cache.local_file_cache import LocalFileCacheManager

logger = setup_logger(__name__)

_SIDECAR_FILENAME = "clip_names.json"


class ThumbnailService:
    def __init__(self, cache_dir: str) -> None:
        self._file_cache = LocalFileCacheManager(cache_dir, ".webp")
        self._sidecar_path = os.path.join(cache_dir, _SIDECAR_FILENAME)

    @staticmethod
    def hash_bytes(data: bytes) -> str:
        return hashlib.blake2b(data, digest_size=32).hexdigest()

    async def _load_sidecar(self) -> dict[str, str]:
        if not os.path.exists(self._sidecar_path):
            return {}
        try:
            async with aiofiles.open(self._sidecar_path, "r", encoding="utf-8") as f:
                return json.loads(await f.read())
        except Exception as e:
            logger.error(f"Sidecar read error: {e}")
            return {}

    async def _save_sidecar(self, mapping: dict[str, str]) -> None:
        try:
            async with aiofiles.open(self._sidecar_path, "w", encoding="utf-8") as f:
                await f.write(json.dumps(mapping))
        except Exception as e:
            logger.error(f"Sidecar write error: {e}")

    async def update_sidecar(self, clip_name: str, content_hash: str) -> None:
        mapping = await self._load_sidecar()
        if mapping.get(clip_name) != content_hash:
            mapping[clip_name] = content_hash
            await self._save_sidecar(mapping)

    async def get_cached_etag(self, clip_name: str) -> Optional[str]:
        return (await self._load_sidecar()).get(clip_name)

    async def invalidate(self, clip_name: str) -> None:
        mapping = await self._load_sidecar()
        if clip_name in mapping:
            del mapping[clip_name]
            await self._save_sidecar(mapping)
            logger.info(f"Invalidated thumbnail cache for '{clip_name}'")

    async def get_cached(self, content_hash: str) -> Optional[bytes]:
        return await self._file_cache.get(content_hash)

    async def cache(self, content_hash: str, data: bytes) -> None:
        await self._file_cache.put(content_hash, data)


thumbnail_service = ThumbnailService(settings.thumbnail_cache_dir)
