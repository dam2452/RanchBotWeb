from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from app.services.ranchbot_api import api_client
from app.core.dependencies import get_current_user
from app.models.user import UserSession
from app.models.clip import ClipCreate
import io

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
        # This calls the 'wys' endpoint with clip ID
        video_data = await api_client.call_api_for_blob(
            endpoint="wys",
            args=[clip_id],
            token=user.jwt_token
        )

        return StreamingResponse(
            io.BytesIO(video_data),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'inline; filename="clip_{clip_id}.mp4"'
            }
        )
    except Exception as e:
        print(f"Get clip video error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
