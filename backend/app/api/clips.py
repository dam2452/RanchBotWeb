import traceback
from urllib.parse import unquote

from app.core.dependencies import get_current_user
from app.core.logger import setup_logger
from app.core.responses import (
    range_video_response,
    thumbnail_not_modified_response,
    thumbnail_response,
)
from app.models.clip import ClipOperationRequest
from app.models.user import UserSession
from app.services.ranchbot_api import (
    Endpoints,
    api_client,
)
from app.services.thumbnail import thumbnail_service
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)

logger = setup_logger(__name__)
router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("")
async def get_clips(user: UserSession = Depends(get_current_user), filter_by_serial: bool = False):
    try:
        clips = await api_client.get_user_clips(user.jwt_token, filter_by_serial=filter_by_serial)
        return {"status": "success", "clips": clips}
    except Exception as e:
        logger.error(f"Get clips error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/{clip_id}")
async def get_clip_video(request: Request, clip_id: str, user: UserSession = Depends(get_current_user)):
    decoded_clip_name = unquote(clip_id)
    try:
        logger.info(f"Fetching clip video: {decoded_clip_name}")
        video_data = await api_client.call_api_for_blob(
            endpoint=Endpoints.CLIP_SEND, args=[decoded_clip_name], token=user.jwt_token,
        )
        range_header = request.headers.get("Range")
        return range_video_response(video_data, range_header)
    except Exception as e:
        logger.error(f"Get clip video error for '{decoded_clip_name}': {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thumbnail/{clip_id}")
async def get_clip_thumbnail(
    request: Request,
    clip_id: str,
    user: UserSession = Depends(get_current_user),
):
    decoded_clip_name = unquote(clip_id)
    if_none_match = request.headers.get("If-None-Match")

    try:
        logger.info(f"Fetching clip thumbnail: {decoded_clip_name}")

        try:
            stored_thumbnail = await api_client.get_saved_clip_thumbnail(decoded_clip_name, user.jwt_token)
            content_hash = thumbnail_service.hash_bytes(stored_thumbnail)
            thumbnail_service.update_sidecar(decoded_clip_name, content_hash)
            if if_none_match and if_none_match.strip('"') == content_hash:
                return thumbnail_not_modified_response(content_hash)
            return thumbnail_response(stored_thumbnail, etag=content_hash)
        except Exception:
            logger.info(f"No stored thumbnail for '{decoded_clip_name}', generating from video")

        thumbnail_data, content_hash = await thumbnail_service.get_or_generate(
            decoded_clip_name,
            lambda: api_client.call_api_for_blob(
                endpoint=Endpoints.CLIP_SEND, args=[decoded_clip_name], token=user.jwt_token,
            ),
            if_none_match=if_none_match,
        )

        if thumbnail_data is None:
            return thumbnail_not_modified_response(content_hash)

        return thumbnail_response(thumbnail_data, etag=content_hash)

    except Exception as e:
        logger.error(f"Get clip thumbnail error for '{decoded_clip_name}': {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_clip(request: ClipOperationRequest, user: UserSession = Depends(get_current_user)):
    try:
        logger.info(f"Saving clip '{request.clip_name}'")
        result = await api_client.save_clip(request.clip_name, user.jwt_token)
        if isinstance(result, dict) and result.get("status") == "error":
            raise HTTPException(status_code=409, detail=result.get("message", "Clip save failed"))
        thumbnail_service.invalidate(request.clip_name)
        return {
            "status": "success",
            "message": f"Clip '{request.clip_name}' saved successfully",
            "data": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save clip error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete")
async def delete_clip(request: ClipOperationRequest, user: UserSession = Depends(get_current_user)):
    try:
        logger.info(f"Deleting clip '{request.clip_name}'")
        result = await api_client.delete_clip(request.clip_name, user.jwt_token)
        thumbnail_service.invalidate(request.clip_name)
        return {
            "status": "success",
            "message": f"Clip '{request.clip_name}' deleted successfully",
            "data": result,
        }
    except Exception as e:
        logger.error(f"Delete clip error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
