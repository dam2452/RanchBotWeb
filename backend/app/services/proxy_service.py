import asyncio
from typing import Any

from fastapi import BackgroundTasks

from app.core.logger import setup_logger
from app.core.responses import (
    range_video_response,
    thumbnail_response,
    video_streaming_response,
)
from app.integrations.ranchbot import RanchBotClient
from app.integrations.ranchbot.endpoints import Endpoints
from app.services.adjusted_video import AdjustedVideoService
from app.services.thumbnail import ThumbnailService
from app.services.video_cache import VideoStreamCache
from fastapi import Response

logger = setup_logger(__name__)

_CACHE_INVALIDATING_ENDPOINTS = frozenset({
    Endpoints.SEARCH_PHRASE,
    Endpoints.SEARCH_SEMANTIC_FRAMES,
})
_IMAGE_ENDPOINTS = frozenset({Endpoints.FRAME, Endpoints.FRAME_ALT, Endpoints.FRAME_SHORT})
_JPEG_MAGIC = b"\xff\xd8\xff"


class ProxyService:
    def __init__(
        self,
        api_client: RanchBotClient,
        video_cache: VideoStreamCache,
        adjusted_video_svc: AdjustedVideoService,
        thumbnail_svc: ThumbnailService,
    ) -> None:
        self._api = api_client
        self._video_cache = video_cache
        self._adjusted_video = adjusted_video_svc
        self._thumbnail = thumbnail_svc

    async def call_json(self, endpoint: str, args: list[Any], token: str) -> dict[str, Any]:
        result = await self._api.call_api(endpoint=endpoint, args=args, token=token)
        if endpoint in _CACHE_INVALIDATING_ENDPOINTS:
            await self._video_cache.clear()
            logger.debug("Video cache cleared after search")
        return result

    async def get_video(self, endpoint: str, args: list[Any], token: str) -> Response:
        video_data = await self._api.call_api_for_blob(endpoint=endpoint, args=args, token=token)
        return video_streaming_response(video_data)

    async def stream_video(
        self, position_id: str, token: str, range_header: str | None,
    ) -> Response:
        video_data = await self._video_cache.get_or_fetch(
            position_id,
            lambda: self._api.call_api_for_blob(
                endpoint=Endpoints.VIDEO_BY_INDEX,
                args=[position_id],
                token=token,
            ),
        )
        return range_video_response(video_data, range_header)

    async def get_thumbnail(self, endpoint: str, args: list[Any], token: str) -> Response:
        data = await self._api.call_api_for_blob(endpoint=endpoint, args=args, token=token)
        content_hash = self._thumbnail.hash_bytes(data)
        if endpoint in _IMAGE_ENDPOINTS or data[:3] == _JPEG_MAGIC:
            return thumbnail_response(data, etag=content_hash, media_type="image/jpeg")
        return thumbnail_response(data, etag=content_hash)

    async def adjust_preview(
        self,
        endpoint: str,
        clip_index: int,
        left_adjust: int,
        right_adjust: int,
        token: str,
    ) -> Response:
        cached = await self._adjusted_video.get_cached(clip_index, left_adjust, right_adjust)
        if cached:
            logger.debug(f"Returning cached adjusted video for clip {clip_index}")
            return video_streaming_response(cached)

        video_data = await self._api.call_api_for_blob(
            endpoint=endpoint,
            args=[clip_index, left_adjust, right_adjust],
            token=token,
        )
        await self._adjusted_video.save_to_cache(clip_index, left_adjust, right_adjust, video_data)
        return video_streaming_response(video_data)

    def start_prefetch(
        self, position_ids: list[str], token: str, background_tasks: BackgroundTasks,
    ) -> int:
        valid_ids = [pid for pid in position_ids if pid.isdigit() and int(pid) >= 1]

        async def _fetch_one(position_id: str) -> None:
            try:
                await self._video_cache.get_or_fetch(
                    position_id,
                    lambda: self._api.call_api_for_blob(
                        endpoint=Endpoints.VIDEO_BY_INDEX,
                        args=[position_id],
                        token=token,
                    ),
                )
            except Exception as e:
                logger.warning(f"Prefetch failed for position {position_id}: {e}")

        async def _run() -> None:
            await asyncio.gather(*[_fetch_one(pid) for pid in valid_ids])

        background_tasks.add_task(_run)
        return len(valid_ids)

    async def batch_load(self, clips: list[Any], token: str) -> dict[str, Any]:
        logger.info(f"Batch loading {len(clips)} clips...")

        async def _load_one(clip: Any) -> dict:
            clip_position_id = str(clip.index + 1)
            logger.debug(f"Loading clip {clip.index}...")
            video_data = await self._api.call_api_for_blob(
                endpoint=Endpoints.VIDEO_BY_INDEX,
                args=[clip_position_id],
                token=token,
            )
            logger.debug(f"Clip {clip.index} loaded ({len(video_data)} bytes)")
            return {"clip_id": clip.id, "clip_index": clip.index, "status": "loaded"}

        results = await asyncio.gather(*[_load_one(clip) for clip in clips], return_exceptions=True)
        successful = [r for r in results if not isinstance(r, Exception)]
        failed = [r for r in results if isinstance(r, Exception)]

        return {
            "status": "completed",
            "total": len(clips),
            "successful": len(successful),
            "failed": len(failed),
            "results": successful,
        }
