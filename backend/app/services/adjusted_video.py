from app.core.config import settings
from app.core.logger import setup_logger
from app.services.cache.local_file_cache import LocalFileCacheManager

logger = setup_logger(__name__)


class AdjustedVideoService:
    def __init__(self, cache_dir: str) -> None:
        self._file_cache = LocalFileCacheManager(cache_dir, ".mp4")

    @staticmethod
    def _cache_key(clip_index: int, left_adjust: int, right_adjust: int) -> str:
        safe = str(clip_index).replace("/", "_").replace("..", "_")
        return f"{safe}_{left_adjust}_{right_adjust}"

    def get_cached(self, clip_index: int, left_adjust: int, right_adjust: int) -> bytes | None:
        return self._file_cache.get(self._cache_key(clip_index, left_adjust, right_adjust))

    def save_to_cache(
        self, clip_index: int, left_adjust: int, right_adjust: int, data: bytes,
    ) -> None:
        key = self._cache_key(clip_index, left_adjust, right_adjust)
        self._file_cache.put(key, data)
        logger.info(f"Adjusted video cached for clip {clip_index} ({len(data)} bytes)")


adjusted_video_service = AdjustedVideoService(settings.adjusted_video_cache_dir)
