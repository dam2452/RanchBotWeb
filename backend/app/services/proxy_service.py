import asyncio
from typing import Any

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
from fastapi import (
    BackgroundTasks,
    Response,
)

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
        return await self._api.call_api(endpoint=endpoint, args=args, token=token)

    async def call_batch_json(self, commands: list[dict[str, Any]], token: str) -> dict[str, Any]:
        return await self._api.call_batch(commands=commands, token=token)

    async def get_video(self, endpoint: str, args: list[Any], token: str) -> Response:
        video_data = await self._api.call_api_for_blob(endpoint=endpoint, args=args, token=token)
        return video_streaming_response(video_data)

    async def stream_video(
        self, position_id: str, search_id: int, token: str, range_header: str | None,
    ) -> Response:
        cache_key = f"{position_id}:{search_id}"
        video_data = await self._video_cache.get_or_fetch(
            cache_key,
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
        self,
        position_ids: list[str],
        search_id: int,
        token: str,
        background_tasks: BackgroundTasks,
    ) -> int:
        valid_ids = [pid for pid in position_ids if pid.isdigit() and int(pid) >= 1]

        async def _fetch_one(position_id: str) -> None:
            cache_key = f"{position_id}:{search_id}"
            try:
                await self._video_cache.get_or_fetch(
                    cache_key,
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
        logger.info("Batch loading %d clips...", len(clips))
        commands = [
            {"command": Endpoints.VIDEO_BY_INDEX, "args": [str(clip.index + 1)]}
            for clip in clips
        ]

        try:
            batch_result = await self._api.call_batch(commands=commands, token=token)
        except Exception:
            logger.exception("Batch load failed")
            return {
                "status": "failed",
                "total": len(clips),
                "successful": 0,
                "failed": len(clips),
                "results": [],
            }

        results = batch_result.get("results", [])
        successful: list[dict[str, Any]] = []
        for i, clip in enumerate(clips):
            result = results[i] if i < len(results) else None
            if isinstance(result, dict) and result.get("status") == "success":
                successful.append({"clip_id": clip.id, "clip_index": clip.index, "status": "loaded"})

        logger.info("Batch load done: %d/%d successful", len(successful), len(clips))
        return {
            "status": "completed",
            "total": len(clips),
            "successful": len(successful),
            "failed": len(clips) - len(successful),
            "results": successful,
        }
