from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from app.services.ranchbot_api import api_client
from app.core.dependencies import get_current_user
from app.models.user import UserSession
from app.models.clip import ClipCreate
import io
from urllib.parse import unquote, quote

router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("")
async def get_clips(
    action: str = Query(...),
    user: UserSession = Depends(get_current_user)
):
    """Get user's clips"""
    if action != "get_clips":
        raise HTTPException(status_code=400, detail="Invalid action")

    try:
        clips = await api_client.get_user_clips(user.jwt_token)
        return {
            "status": "success",
            "clips": clips
        }
    except Exception as e:
        print(f"Get clips error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/{clip_id}")
async def get_clip_video(
    clip_id: str,
    user: UserSession = Depends(get_current_user)
):
    """Get video for a specific clip"""
    try:
        decoded_clip_name = unquote(clip_id)
        print(f"Fetching clip video: {decoded_clip_name}")

        video_data = await api_client.call_api_for_blob(
            endpoint="wys",
            args=[decoded_clip_name],
            token=user.jwt_token
        )

        encoded_filename = quote(decoded_clip_name)

        return StreamingResponse(
            io.BytesIO(video_data),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}.mp4",
                "Content-Length": str(len(video_data)),
                "Accept-Ranges": "bytes"
            }
        )
    except Exception as e:
        print(f"Get clip video error for '{decoded_clip_name}': {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
