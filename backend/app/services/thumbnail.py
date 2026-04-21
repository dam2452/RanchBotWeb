import hashlib
import io
import os
import subprocess
import tempfile
from typing import Callable, Awaitable, Optional

from PIL import Image

from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__)


class ThumbnailService:
    def __init__(self, cache_dir: str):
        self._cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    @staticmethod
    def _content_hash(data: bytes) -> str:
        return hashlib.md5(data).hexdigest()

    def _cache_path(self, cache_key: str) -> str:
        sanitized = "".join(c if c.isalnum() or c in "-_" else "_" for c in cache_key)
        return os.path.join(self._cache_dir, f"{sanitized}.webp")

    async def get_or_generate(self, _clip_id: str, fetch_video: Callable[[], Awaitable[bytes]]) -> bytes:
        video_data = await fetch_video()
        content_key = self._content_hash(video_data)
        cached = self._get_cached_by_key(content_key)
        if cached:
            return cached
        return self._extract_and_cache(video_data, content_key)

    def _get_cached_by_key(self, cache_key: str) -> Optional[bytes]:
        path = self._cache_path(cache_key)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Cache read error: {e}")
            return None

    def _extract_and_cache(self, video_data: bytes, cache_key: str) -> bytes:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_video:
            tmp_video.write(video_data)
            tmp_video_path = tmp_video.name

        tmp_frame_path = tmp_video_path.replace(".mp4", "_frame.png")

        try:
            result = subprocess.run(
                ['ffmpeg', '-i', tmp_video_path, '-vframes', '1', '-ss', '0', '-vf', 'scale=1280:-1', '-y', tmp_frame_path],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                raise Exception(f"ffmpeg failed: {result.stderr}")

            if not os.path.exists(tmp_frame_path):
                raise Exception("Failed to extract frame with ffmpeg")

            with Image.open(tmp_frame_path) as img:
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=85)
                thumbnail_data = output.getvalue()

            cache_path = self._cache_path(cache_key)
            try:
                with open(cache_path, "wb") as f:
                    f.write(thumbnail_data)
            except Exception as e:
                logger.error(f"Cache write error: {e}")

            return thumbnail_data

        except Exception as e:
            logger.error(f"Thumbnail extraction error: {e}")
            raise Exception(f"Failed to extract thumbnail: {str(e)}")

        finally:
            for path in (tmp_video_path, tmp_frame_path):
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except Exception:
                    pass

    def extract_thumbnail(self, video_data: bytes, clip_id: str) -> bytes:
        content_key = self._content_hash(video_data)
        cached = self._get_cached_by_key(content_key)
        if cached:
            return cached
        return self._extract_and_cache(video_data, content_key)


thumbnail_service = ThumbnailService(settings.thumbnail_cache_dir)
