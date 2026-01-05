from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Any, Optional
from app.services.ranchbot_api import api_client
from app.services.thumbnail import thumbnail_service
from app.core.dependencies import get_current_user
from app.models.user import UserSession
from app.core.queue import queue_manager
from app.core.config import settings
import io
import time
import hashlib
import asyncio
import os

router = APIRouter(prefix="/api", tags=["api-proxy"])


class ApiRequest(BaseModel):
    endpoint: str
    args: List[Any]
    cacheKey: Optional[str] = None


class BatchLoadRequest(BaseModel):
    clips: List[dict]


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
    """Generate thumbnail from video API request (async with RabbitMQ)"""
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

        job_id = hashlib.md5(f"{cache_key}-{time.time()}".encode()).hexdigest()

        queue_manager.publish_thumbnail_job(
            job_id=job_id,
            clip_id=cache_key,
            endpoint=request.endpoint,
            args=request.args,
            token=user.jwt_token
        )

        print(f"Enqueued thumbnail job {job_id} for clip {cache_key}")

        max_wait_time = settings.thumbnail_max_wait
        poll_interval = settings.thumbnail_poll_interval
        elapsed = 0

        while elapsed < max_wait_time:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            cached_thumbnail = thumbnail_service.get_cached_thumbnail(cache_key)
            if cached_thumbnail:
                print(f"Thumbnail ready for clip {cache_key} after {elapsed:.1f}s")
                return Response(
                    content=cached_thumbnail,
                    media_type="image/webp",
                    headers={
                        "Cache-Control": "public, max-age=86400",
                        "Content-Length": str(len(cached_thumbnail))
                    }
                )

        raise HTTPException(status_code=504, detail="Thumbnail generation timeout")

    except Exception as e:
        print(f"API Thumbnail error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adjust-preview")
async def api_adjust_preview(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user)
):
    """Video adjustment (trim/extend) with RabbitMQ async processing"""
    try:
        clip_index = request.args[0]
        left_adjust = request.args[1]
        right_adjust = request.args[2]

        safe_clip_index = str(clip_index).replace('/', '_').replace('..', '_')
        cache_key = f"{safe_clip_index}_{left_adjust}_{right_adjust}"
        cache_path = os.path.join(settings.adjusted_video_cache_dir, f"{cache_key}.mp4")

        if os.path.exists(cache_path):
            print(f"Returning cached adjusted video for {cache_key}")
            with open(cache_path, 'rb') as f:
                video_data = f.read()
            return StreamingResponse(
                io.BytesIO(video_data),
                media_type="video/mp4",
                headers={"Content-Disposition": "inline"}
            )

        job_id = hashlib.md5(f"{cache_key}-{time.time()}".encode()).hexdigest()

        queue_manager.publish_adjustment_job(
            job_id=job_id,
            clip_index=clip_index,
            left_adjust=left_adjust,
            right_adjust=right_adjust,
            token=user.jwt_token
        )

        print(f"Enqueued adjustment job {job_id} for clip {clip_index}")

        max_wait_time = settings.adjustment_max_wait
        poll_interval = settings.adjustment_poll_interval
        elapsed = 0

        while elapsed < max_wait_time:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            cache_path_with_jobid = f"{settings.adjusted_video_cache_dir}/{job_id}.mp4"
            if os.path.exists(cache_path_with_jobid):
                print(f"Adjusted video ready after {elapsed:.1f}s")
                with open(cache_path_with_jobid, 'rb') as f:
                    video_data = f.read()

                os.rename(cache_path_with_jobid, cache_path)

                return StreamingResponse(
                    io.BytesIO(video_data),
                    media_type="video/mp4",
                    headers={"Content-Disposition": "inline"}
                )

        raise HTTPException(status_code=504, detail="Video adjustment timeout")

    except HTTPException:
        raise
    except Exception as e:
        print(f"API Adjust Preview error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-load")
async def api_batch_load(
    request: BatchLoadRequest,
    user: UserSession = Depends(get_current_user)
):
    """Parallel batch loading of clips (asyncio.gather)"""
    try:
        print(f"Batch loading {len(request.clips)} clips...")

        async def load_clip(clip):
            clip_id = clip['id']
            clip_index = clip['index']
            clip_position_id = str(clip_index + 1)

            print(f"Loading clip {clip_index}...")
            video_data = await api_client.call_api_for_blob(
                endpoint='/w',
                args=[clip_position_id],
                token=user.jwt_token
            )
            thumbnail_service.extract_thumbnail(video_data, str(clip_id))
            print(f"Clip {clip_index} loaded ({len(video_data)} bytes)")

            return {"clip_id": clip_id, "clip_index": clip_index, "status": "loaded"}

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
        print(f"API Batch Load error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


