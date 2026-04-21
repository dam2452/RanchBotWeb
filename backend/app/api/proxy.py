import asyncio
import traceback
from typing import List, Any, Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.core.logger import setup_logger
from app.core.responses import thumbnail_response, video_streaming_response
from app.models.user import UserSession
from app.services.adjusted_video import adjusted_video_service
from app.services.ranchbot_api import api_client
from app.services.thumbnail import thumbnail_service

logger = setup_logger(__name__)
router = APIRouter(prefix="/api", tags=["api-proxy"])


class ApiRequest(BaseModel):
    endpoint: str
    args: List[Any]
    cacheKey: Optional[str] = None


class AdjustPreviewRequest(BaseModel):
    endpoint: str
    clip_index: int
    left_adjust: int
    right_adjust: int


class ClipLoadItem(BaseModel):
    id: str
    index: int


class BatchLoadRequest(BaseModel):
    clips: List[ClipLoadItem]


@router.post("/json")
async def api_json(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    try:
        return await api_client.call_api(endpoint=request.endpoint, args=request.args, token=user.jwt_token)
    except Exception as e:
        logger.error(f"API JSON error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video")
async def api_video(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    try:
        video_data = await api_client.call_api_for_blob(
            endpoint=request.endpoint, args=request.args, token=user.jwt_token
        )
        return video_streaming_response(video_data)
    except Exception as e:
        logger.error(f"API Video error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/thumbnail")
async def api_thumbnail(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    try:
        position_key = str(request.args[0]) if request.args else "unknown"
        cache_key = f"{request.cacheKey}_{position_key}" if request.cacheKey else position_key
        logger.info(f"Thumbnail request - endpoint: {request.endpoint}, cacheKey: {cache_key}")

        thumbnail_data = await thumbnail_service.get_or_generate(
            cache_key,
            lambda: api_client.call_api_for_blob(
                endpoint=request.endpoint, args=request.args, token=user.jwt_token
            )
        )
        return thumbnail_response(thumbnail_data, cacheable=False)
    except Exception as e:
        logger.error(f"API Thumbnail error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adjust-preview")
async def api_adjust_preview(
    request: AdjustPreviewRequest,
    user: UserSession = Depends(get_current_user)
):
    try:
        cached = adjusted_video_service.get_cached(
            request.clip_index, request.left_adjust, request.right_adjust
        )
        if cached:
            logger.debug(f"Returning cached adjusted video for clip {request.clip_index}")
            return video_streaming_response(cached)

        video_data = await api_client.call_api_for_blob(
            endpoint=request.endpoint,
            args=[request.clip_index, request.left_adjust, request.right_adjust],
            token=user.jwt_token
        )

        adjusted_video_service.save_to_cache(
            request.clip_index, request.left_adjust, request.right_adjust, video_data
        )
        return video_streaming_response(video_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API Adjust Preview error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-load")
async def api_batch_load(
    request: BatchLoadRequest,
    user: UserSession = Depends(get_current_user)
):
    try:
        logger.info(f"Batch loading {len(request.clips)} clips...")

        async def load_clip(clip: ClipLoadItem) -> dict:
            clip_position_id = str(clip.index + 1)
            logger.debug(f"Loading clip {clip.index}...")
            video_data = await api_client.call_api_for_blob(
                endpoint='/w', args=[clip_position_id], token=user.jwt_token
            )
            thumbnail_service.extract_thumbnail(video_data, str(clip.id))
            logger.debug(f"Clip {clip.index} loaded ({len(video_data)} bytes)")
            return {"clip_id": clip.id, "clip_index": clip.index, "status": "loaded"}

        results = await asyncio.gather(*[load_clip(clip) for clip in request.clips], return_exceptions=True)

        successful = [r for r in results if not isinstance(r, Exception)]
        failed = [r for r in results if isinstance(r, Exception)]

        return {
            "status": "completed",
            "total": len(request.clips),
            "successful": len(successful),
            "failed": len(failed),
            "results": successful
        }

    except Exception as e:
        logger.error(f"API Batch Load error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
