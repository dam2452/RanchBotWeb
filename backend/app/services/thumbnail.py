from PIL import Image
import subprocess
import io
import hashlib
import os
from typing import Optional


class ThumbnailService:
    def __init__(self, cache_dir: str = "/tmp/thumbnails"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def _get_cache_key(self, clip_id: str) -> str:
        return hashlib.md5(clip_id.encode()).hexdigest()

    def _get_cache_path(self, clip_id: str) -> str:
        cache_key = self._get_cache_key(clip_id)
        return os.path.join(self.cache_dir, f"{cache_key}.webp")

    def get_cached_thumbnail(self, clip_id: str) -> Optional[bytes]:
        cache_path = self._get_cache_path(clip_id)
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "rb") as f:
                    return f.read()
            except Exception as e:
                print(f"Cache read error: {e}")
                return None
        return None

    def extract_thumbnail(self, video_data: bytes, clip_id: str) -> bytes:
        cached = self.get_cached_thumbnail(clip_id)
        if cached:
            return cached

        temp_video_path = None
        temp_frame_path = None

        try:
            cache_key = self._get_cache_key(clip_id)
            temp_video_path = f"/tmp/{cache_key}.mp4"
            temp_frame_path = f"/tmp/{cache_key}_frame.png"

            with open(temp_video_path, 'wb') as f:
                f.write(video_data)

            result = subprocess.run([
                'ffmpeg',
                '-i', temp_video_path,
                '-vframes', '1',
                '-ss', '0',
                '-vf', 'scale=1280:-1',
                '-y',
                temp_frame_path
            ], capture_output=True, text=True)

            if result.returncode != 0:
                raise Exception(f"ffmpeg failed: {result.stderr}")

            if not os.path.exists(temp_frame_path):
                raise Exception("Failed to extract frame with ffmpeg")

            with Image.open(temp_frame_path) as img:
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=85)
                thumbnail_data = output.getvalue()

            cache_path = self._get_cache_path(clip_id)
            try:
                with open(cache_path, "wb") as f:
                    f.write(thumbnail_data)
            except Exception as e:
                print(f"Cache write error: {e}")

            return thumbnail_data

        except Exception as e:
            print(f"Thumbnail extraction error: {e}")
            raise Exception(f"Failed to extract thumbnail: {str(e)}")

        finally:
            if temp_video_path and os.path.exists(temp_video_path):
                try:
                    os.remove(temp_video_path)
                except Exception:
                    pass
            if temp_frame_path and os.path.exists(temp_frame_path):
                try:
                    os.remove(temp_frame_path)
                except Exception:
                    pass


thumbnail_service = ThumbnailService()
