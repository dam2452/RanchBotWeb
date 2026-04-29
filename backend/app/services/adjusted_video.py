import os

from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__)


class AdjustedVideoService:
    def __init__(self, cache_dir: str):
        self._cache_dir = cache_dir

    def _cache_key(self, clip_index: int, left_adjust: int, right_adjust: int) -> str:
        safe = str(clip_index).replace("/", "_").replace("..", "_")
        return f"{safe}_{left_adjust}_{right_adjust}"

    def _cache_path(self, key: str) -> str:
        return os.path.join(self._cache_dir, f"{key}.mp4")

    def get_cached(self, clip_index: int, left_adjust: int, right_adjust: int) -> bytes | None:
        path = self._cache_path(self._cache_key(clip_index, left_adjust, right_adjust))
        if not os.path.exists(path):
            return None
        try:
            with open(path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Adjusted video cache read error: {e}")
            return None

    def save_to_cache(
        self, clip_index: int, left_adjust: int, right_adjust: int, data: bytes,
    ) -> None:
        os.makedirs(self._cache_dir, exist_ok=True)
        path = self._cache_path(self._cache_key(clip_index, left_adjust, right_adjust))
        try:
            with open(path, "wb") as f:
                f.write(data)
            logger.info(f"Adjusted video cached for clip {clip_index} ({len(data)} bytes)")
        except Exception as e:
            logger.error(f"Adjusted video cache write error: {e}")


adjusted_video_service = AdjustedVideoService(settings.adjusted_video_cache_dir)
