from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Any
from app.services.ranchbot_api import api_client
from app.core.dependencies import get_current_user
from app.models.user import UserSession
import io

router = APIRouter(prefix="/api", tags=["api-proxy"])


class ApiRequest(BaseModel):
    endpoint: str
    args: List[Any]


@router.post("/json")
async def api_json(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    """Proxy JSON API requests"""
    try:
        result = await api_client.call_api(
            endpoint=request.endpoint,
            args=request.args,
            token=user.jwt_token
        )
        return result
    except Exception as e:
        print(f"API JSON error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video")
async def api_video(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    """Proxy video API requests (returns blob)"""
    try:
        video_data = await api_client.call_api_for_blob(
            endpoint=request.endpoint,
            args=request.args,
            token=user.jwt_token
        )

        return StreamingResponse(
            io.BytesIO(video_data),
            media_type="video/mp4",
            headers={
                "Content-Disposition": "inline"
            }
        )
    except Exception as e:
        print(f"API Video error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
