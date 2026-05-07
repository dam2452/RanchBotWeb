from app.core.logger import setup_logger
from app.core.responses import (
    range_video_response,
    thumbnail_not_modified_response,
    thumbnail_response,
)
from app.integrations.ranchbot.clips_api import RanchBotClipsAPI
from app.services.thumbnail import ThumbnailService
from fastapi import HTTPException, Response

logger = setup_logger(__name__)


class ClipService:
    def __init__(self, clips_api: RanchBotClipsAPI, thumbnail_svc: ThumbnailService) -> None:
        self._clips_api = clips_api
        self._thumbnail = thumbnail_svc

    async def get_clips(self, token: str, filter_by_serial: bool) -> dict:
        clips = await self._clips_api.get_user_clips(token, filter_by_serial)
        return {"status": "success", "clips": clips}

    async def get_clip_video(
        self, clip_name: str, token: str, range_header: str | None,
    ) -> Response:
        logger.info(f"Fetching clip video: {clip_name}")
        video_data = await self._clips_api.get_clip_video(clip_name, token)
        return range_video_response(video_data, range_header)

    async def get_clip_thumbnail(
        self, clip_name: str, token: str, if_none_match: str | None,
    ) -> Response:
        logger.info(f"Fetching clip thumbnail: {clip_name}")
        thumbnail_data = await self._clips_api.get_saved_clip_thumbnail(clip_name, token)
        content_hash = self._thumbnail.hash_bytes(thumbnail_data)
        self._thumbnail.update_sidecar(clip_name, content_hash)

        if if_none_match and if_none_match.strip('"') == content_hash:
            return thumbnail_not_modified_response(content_hash)

        self._thumbnail.cache(content_hash, thumbnail_data)
        return thumbnail_response(thumbnail_data, etag=content_hash)

    async def save_clip(self, clip_name: str, token: str) -> dict:
        logger.info(f"Saving clip '{clip_name}'")
        result = await self._clips_api.save_clip(clip_name, token)
        if isinstance(result, dict) and result.get("status") == "error":
            raise HTTPException(status_code=409, detail=result.get("message", "Clip save failed"))
        self._thumbnail.invalidate(clip_name)
        return {
            "status": "success",
            "message": f"Clip '{clip_name}' saved successfully",
            "data": result,
        }

    async def delete_clip(self, clip_name: str, token: str) -> dict:
        logger.info(f"Deleting clip '{clip_name}'")
        result = await self._clips_api.delete_clip(clip_name, token)
        self._thumbnail.invalidate(clip_name)
        return {
            "status": "success",
            "message": f"Clip '{clip_name}' deleted successfully",
            "data": result,
        }


def _create_clip_service() -> ClipService:
    from app.integrations.ranchbot import api_client
    from app.services.thumbnail import thumbnail_service
    return ClipService(api_client.clips, thumbnail_service)


clip_service = _create_clip_service()
