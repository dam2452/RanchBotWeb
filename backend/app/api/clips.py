import traceback
from urllib.parse import unquote

from app.core.dependencies import get_current_user
from app.core.logger import setup_logger
from app.core.responses import (
    thumbnail_response,
    video_streaming_response,
)
from app.models.clip import ClipOperationRequest
from app.models.user import UserSession
from app.services.ranchbot_api import (
    Endpoints,
    api_client,
)
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

logger = setup_logger(__name__)
router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("")
async def get_clips(user: UserSession = Depends(get_current_user)):
    try:
        clips = await api_client.get_user_clips(user.jwt_token)
        return {"status": "success", "clips": clips}
    except Exception as e:
        logger.error(f"Get clips error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/{clip_id}")
async def get_clip_video(clip_id: str, user: UserSession = Depends(get_current_user)):
    decoded_clip_name = unquote(clip_id)
    try:
        logger.info(f"Fetching clip video: {decoded_clip_name}")
        video_data = await api_client.call_api_for_blob(
            endpoint=Endpoints.CLIP_SEND, args=[decoded_clip_name], token=user.jwt_token,
        )
        return video_streaming_response(video_data, filename=decoded_clip_name)
    except Exception as e:
        logger.error(f"Get clip video error for '{decoded_clip_name}': {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thumbnail/{clip_id}")
async def get_clip_thumbnail(clip_id: str, user: UserSession = Depends(get_current_user)):
    decoded_clip_name = unquote(clip_id)
    try:
        logger.info(f"Fetching clip thumbnail: {decoded_clip_name}")
        thumbnail_data = await api_client.get_saved_clip_thumbnail(decoded_clip_name, user.jwt_token)
        return thumbnail_response(thumbnail_data)
    except Exception as e:
        logger.error(f"Get clip thumbnail error for '{decoded_clip_name}': {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_clip(request: ClipOperationRequest, user: UserSession = Depends(get_current_user)):
    try:
        logger.info(f"Saving clip '{request.clip_name}'")
        result = await api_client.save_clip(request.clip_name, user.jwt_token)
        return {
            "status": "success",
            "message": f"Clip '{request.clip_name}' saved successfully",
            "data": result,
        }
    except Exception as e:
        logger.error(f"Save clip error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete")
async def delete_clip(request: ClipOperationRequest, user: UserSession = Depends(get_current_user)):
    try:
        logger.info(f"Deleting clip '{request.clip_name}'")
        result = await api_client.delete_clip(request.clip_name, user.jwt_token)
        return {
            "status": "success",
            "message": f"Clip '{request.clip_name}' deleted successfully",
            "data": result,
        }
    except Exception as e:
        logger.error(f"Delete clip error: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
