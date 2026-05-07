from typing import Any

from app.core.dependencies import (
    get_current_user,
    get_proxy_service,
)
from app.models.user import UserSession
from app.services.proxy_service import ProxyService
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
)
from pydantic import BaseModel

router = APIRouter(tags=["api-proxy"])


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
    search_id: int = 0


@router.post("/json")
async def api_json(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    return await proxy_svc.call_json(request.endpoint, request.args, user.jwt_token)


@router.post("/video")
async def api_video(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    return await proxy_svc.get_video(request.endpoint, request.args, user.jwt_token)


@router.get("/video/stream/{position_id}")
async def api_video_stream(
    position_id: str,
    request: Request,
    s: int = Query(0, ge=0),
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    if not position_id.isdigit() or int(position_id) < 1:
        raise HTTPException(status_code=400, detail="position_id must be a positive integer")
    return await proxy_svc.stream_video(
        position_id, s, user.jwt_token, request.headers.get("range"),
    )


@router.post("/thumbnail")
async def api_thumbnail(
    request: ApiRequest,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    return await proxy_svc.get_thumbnail(request.endpoint, request.args, user.jwt_token)


@router.post("/adjust-preview")
async def api_adjust_preview(
    request: AdjustPreviewRequest,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    return await proxy_svc.adjust_preview(
        request.endpoint,
        request.clip_index,
        request.left_adjust,
        request.right_adjust,
        user.jwt_token,
    )


@router.post("/prefetch")
async def api_prefetch(
    request: PrefetchRequest,
    background_tasks: BackgroundTasks,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    count = proxy_svc.start_prefetch(request.position_ids, request.search_id, user.jwt_token, background_tasks)
    return {"status": "prefetching", "count": count}


@router.post("/batch-load")
async def api_batch_load(
    request: BatchLoadRequest,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    return await proxy_svc.batch_load(request.clips, user.jwt_token)
