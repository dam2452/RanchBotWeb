from collections.abc import (
    Awaitable,
    Callable,
)
import hashlib
import io
import json
import os
import subprocess
import tempfile
from typing import Optional

from PIL import Image
from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__)

_SIDECAR_FILENAME = "clip_names.json"


class ThumbnailService:
    def __init__(self, cache_dir: str):
        self._cache_dir = cache_dir
        self._sidecar_path = os.path.join(cache_dir, _SIDECAR_FILENAME)
        os.makedirs(cache_dir, exist_ok=True)

    @staticmethod
    def hash_bytes(data: bytes) -> str:
        return hashlib.blake2b(data, digest_size=32).hexdigest()

    def _cache_path(self, content_hash: str) -> str:
        return os.path.join(self._cache_dir, f"{content_hash}.webp")

    def _load_sidecar(self) -> dict[str, str]:
        if not os.path.exists(self._sidecar_path):
            return {}
        try:
            with open(self._sidecar_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Sidecar read error: {e}")
            return {}

    def _save_sidecar(self, mapping: dict[str, str]) -> None:
        try:
            with open(self._sidecar_path, "w", encoding="utf-8") as f:
                json.dump(mapping, f)
        except Exception as e:
            logger.error(f"Sidecar write error: {e}")

    def update_sidecar(self, clip_name: str, content_hash: str) -> None:
        mapping = self._load_sidecar()
        if mapping.get(clip_name) != content_hash:
            mapping[clip_name] = content_hash
            self._save_sidecar(mapping)

    def get_cached_etag(self, clip_name: str) -> Optional[str]:
        return self._load_sidecar().get(clip_name)

    def invalidate(self, clip_name: str) -> None:
        mapping = self._load_sidecar()
        if clip_name in mapping:
            del mapping[clip_name]
            self._save_sidecar(mapping)
            logger.info(f"Invalidated thumbnail cache for '{clip_name}'")

    async def get_or_generate(
        self,
        clip_name: str,
        fetch_video: Callable[[], Awaitable[bytes]],
        if_none_match: Optional[str] = None,
    ) -> tuple[Optional[bytes], str]:
        video_data = await fetch_video()
        content_hash = self.hash_bytes(video_data)

        if if_none_match and if_none_match.strip('"') == content_hash:
            return None, content_hash

        cached = self._get_cached_by_hash(content_hash)
        if cached:
            self.update_sidecar(clip_name, content_hash)
            return cached, content_hash

        thumbnail_data = self._extract_and_cache(video_data, content_hash)
        self.update_sidecar(clip_name, content_hash)
        return thumbnail_data, content_hash

    def _get_cached_by_hash(self, content_hash: str) -> Optional[bytes]:
        path = self._cache_path(content_hash)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Cache read error: {e}")
            return None

    @staticmethod
    def _validate_mp4(data: bytes) -> None:
        if len(data) < 8:
            raise ValueError(f"Video data too small ({len(data)} bytes) - likely not a valid MP4")
        box_type = data[4:8]
        valid_boxes = {b"ftyp", b"moov", b"mdat", b"wide", b"free", b"skip"}
        if box_type not in valid_boxes:
            preview = data[:64]
            raise ValueError(
                f"Video data does not look like MP4 (box={box_type!r}). First bytes: {preview!r}",
            )

    def _extract_and_cache(self, video_data: bytes, content_hash: str) -> bytes:
        self._validate_mp4(video_data)
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_video:
            tmp_video.write(video_data)
            tmp_video_path = tmp_video.name

        tmp_frame_path = tmp_video_path.replace(".mp4", "_frame.png")

        try:
            result = subprocess.run(
                [
                    "ffmpeg",
                    "-i", tmp_video_path,
                    "-vframes", "1",
                    "-ss", "0",
                    "-vf", "scale=1280:-1",
                    "-y", tmp_frame_path,
                ],
                capture_output=True,
                text=True,
            )

            if result.returncode != 0:
                raise RuntimeError(f"ffmpeg failed: {result.stderr}")

            if not os.path.exists(tmp_frame_path):
                raise RuntimeError("Failed to extract frame with ffmpeg")

            with Image.open(tmp_frame_path) as img:
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=85)
                thumbnail_data = output.getvalue()

            cache_path = self._cache_path(content_hash)
            try:
                with open(cache_path, "wb") as f:
                    f.write(thumbnail_data)
            except Exception as e:
                logger.error(f"Cache write error: {e}")

            return thumbnail_data

        except Exception as e:
            logger.error(f"Thumbnail extraction error: {e}")
            raise RuntimeError(f"Failed to extract thumbnail: {str(e)}")

        finally:
            for path in (tmp_video_path, tmp_frame_path):
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except Exception:
                    pass

    def extract_thumbnail(self, video_data: bytes, clip_name: str) -> bytes:
        content_hash = self.hash_bytes(video_data)
        cached = self._get_cached_by_hash(content_hash)
        if cached:
            self.update_sidecar(clip_name, content_hash)
            return cached
        thumbnail_data = self._extract_and_cache(video_data, content_hash)
        self.update_sidecar(clip_name, content_hash)
        return thumbnail_data


thumbnail_service = ThumbnailService(settings.thumbnail_cache_dir)
