from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Any, Optional
from app.services.ranchbot_api import api_client
from app.services.thumbnail import thumbnail_service
from app.core.dependencies import get_current_user
from app.models.user import UserSession
import io

router = APIRouter(prefix="/api", tags=["api-proxy"])


class ApiRequest(BaseModel):
    endpoint: str
    args: List[Any]
    cacheKey: Optional[str] = None


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


@router.post("/thumbnail")
async def api_thumbnail(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    """Generate thumbnail from video API request"""
    try:
        print(f"Thumbnail request - endpoint: {request.endpoint}, args: {request.args}, cacheKey: {request.cacheKey}")
        cache_key = request.cacheKey if request.cacheKey else (request.args[0] if request.args else "unknown")

        cached_thumbnail = thumbnail_service.get_cached_thumbnail(cache_key)
        if cached_thumbnail:
            print(f"Returning cached thumbnail for clip: {cache_key}")
            return Response(
                content=cached_thumbnail,
                media_type="image/webp",
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Content-Length": str(len(cached_thumbnail))
                }
            )

        video_data = await api_client.call_api_for_blob(
            endpoint=request.endpoint,
            args=request.args,
            token=user.jwt_token
        )

        thumbnail_data = thumbnail_service.extract_thumbnail(video_data, cache_key)

        return Response(
            content=thumbnail_data,
            media_type="image/webp",
            headers={
                "Cache-Control": "public, max-age=86400",
                "Content-Length": str(len(thumbnail_data))
            }
        )
    except Exception as e:
        print(f"API Thumbnail error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
