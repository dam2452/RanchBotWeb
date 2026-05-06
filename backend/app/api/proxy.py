import asyncio
import traceback
from typing import Any

from app.core.dependencies import get_current_user
from app.core.logger import setup_logger
from app.core.responses import (
    range_video_response,
    thumbnail_response,
    video_streaming_response,
)
from app.models.user import UserSession
from app.services.adjusted_video import adjusted_video_service
from app.services.ranchbot_api import (
    Endpoints,
    api_client,
)
from app.services.thumbnail import thumbnail_service
from app.services.video_cache import video_cache
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from pydantic import BaseModel

logger = setup_logger(__name__)
router = APIRouter(prefix="/api", tags=["api-proxy"])


class ApiRequest(BaseModel):
    endpoint: str
    args: list[Any]


class AdjustPreviewRequest(BaseModel):
    endpoint: str
    clip_index: int
    left_adjust: int
    right_adjust: int


class ClipLoadItem(BaseModel):
    id: str
    index: int


class BatchLoadRequest(BaseModel):
    clips: list[ClipLoadItem]


class PrefetchRequest(BaseModel):
    position_ids: list[str]


_CACHE_INVALIDATING_ENDPOINTS = {Endpoints.SEARCH_PHRASE, Endpoints.SEARCH_SEMANTIC_FRAMES}


@router.post("/json")
async def api_json(request: ApiRequest, user: UserSession = Depends(get_current_user)):
    try:
        result = await api_client.call_api(
            endpoint=request.endpoint, args=request.args, token=user.jwt_token,
        )
        if request.endpoint in _CACHE_INVALIDATING_ENDPOINTS:
            await video_cache.clear()
            logger.debug("Video cache cleared after search")
        return result
    except Exception as e:
        logger.error(f"API JSON error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video")
async def api_video(request: ApiRequest, user: UserSession = Depends(get_current_user)):
    try:
        video_data = await api_client.call_api_for_blob(
            endpoint=request.endpoint, args=request.args, token=user.jwt_token,
        )
        return video_streaming_response(video_data)
    except Exception as e:
        logger.error(f"API Video error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/stream/{position_id}")
async def api_video_stream(
    position_id: str,
    request: Request,
    user: UserSession = Depends(get_current_user),
):
    if not position_id.isdigit() or int(position_id) < 1:
        raise HTTPException(status_code=400, detail="position_id must be a positive integer")

    try:
        video_data = await video_cache.get_or_fetch(
            position_id,
            lambda: api_client.call_api_for_blob(
                endpoint=Endpoints.VIDEO_BY_INDEX,
                args=[position_id],
                token=user.jwt_token,
            ),
        )
        return range_video_response(video_data, request.headers.get("range"))
    except Exception as e:
        logger.error(f"API Video Stream error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


_IMAGE_ENDPOINTS = {Endpoints.FRAME, Endpoints.FRAME_ALT, Endpoints.FRAME_SHORT}
_JPEG_MAGIC = b"\xff\xd8\xff"


@router.post("/thumbnail")
async def api_thumbnail(request: ApiRequest, user: UserSession = Depends(get_current_user)):
    try:
        data = await api_client.call_api_for_blob(
            endpoint=request.endpoint, args=request.args, token=user.jwt_token,
        )
        if request.endpoint in _IMAGE_ENDPOINTS or data[:3] == _JPEG_MAGIC:
            return thumbnail_response(data, cacheable=False, media_type="image/jpeg")
        thumbnail_data = await thumbnail_service.get_or_generate(
            "",
            lambda: _resolve_bytes(data),
        )
        return thumbnail_response(thumbnail_data, cacheable=False)
    except Exception as e:
        logger.error(f"API Thumbnail error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


async def _resolve_bytes(data: bytes) -> bytes:
    return data


@router.post("/adjust-preview")
async def api_adjust_preview(
    request: AdjustPreviewRequest, user: UserSession = Depends(get_current_user),
):
    try:
        cached = adjusted_video_service.get_cached(
            request.clip_index, request.left_adjust, request.right_adjust,
        )
        if cached:
            logger.debug(f"Returning cached adjusted video for clip {request.clip_index}")
            return video_streaming_response(cached)

        video_data = await api_client.call_api_for_blob(
            endpoint=request.endpoint,
            args=[request.clip_index, request.left_adjust, request.right_adjust],
            token=user.jwt_token,
        )

        adjusted_video_service.save_to_cache(
            request.clip_index, request.left_adjust, request.right_adjust, video_data,
        )
        return video_streaming_response(video_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API Adjust Preview error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prefetch")
async def api_prefetch(request: PrefetchRequest, user: UserSession = Depends(get_current_user)):
    async def _fetch_one(position_id: str) -> None:
        try:
            await video_cache.get_or_fetch(
                position_id,
                lambda: api_client.call_api_for_blob(
                    endpoint=Endpoints.VIDEO_BY_INDEX,
                    args=[position_id],
                    token=user.jwt_token,
                ),
            )
        except Exception as e:
            logger.warning(f"Prefetch failed for position {position_id}: {e}")

    valid_ids = [pid for pid in request.position_ids if pid.isdigit() and int(pid) >= 1]

    async def _run() -> None:
        await asyncio.gather(*[_fetch_one(pid) for pid in valid_ids])

    asyncio.create_task(_run())
    return {"status": "prefetching", "count": len(valid_ids)}


@router.post("/batch-load")
async def api_batch_load(request: BatchLoadRequest, user: UserSession = Depends(get_current_user)):
    try:
        logger.info(f"Batch loading {len(request.clips)} clips...")

        async def load_clip(clip: ClipLoadItem) -> dict:
            clip_position_id = str(clip.index + 1)
            logger.debug(f"Loading clip {clip.index}...")
            video_data = await api_client.call_api_for_blob(
                endpoint=Endpoints.VIDEO_BY_INDEX, args=[clip_position_id], token=user.jwt_token,
            )
            thumbnail_service.extract_thumbnail(video_data, str(clip.id))
            logger.debug(f"Clip {clip.index} loaded ({len(video_data)} bytes)")
            return {"clip_id": clip.id, "clip_index": clip.index, "status": "loaded"}

        results = await asyncio.gather(
            *[load_clip(clip) for clip in request.clips], return_exceptions=True,
        )

        successful = [r for r in results if not isinstance(r, Exception)]
        failed = [r for r in results if isinstance(r, Exception)]

        return {
            "status": "completed",
            "total": len(request.clips),
            "successful": len(successful),
            "failed": len(failed),
            "results": successful,
        }

    except Exception as e:
        logger.error(f"API Batch Load error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
