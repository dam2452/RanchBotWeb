from urllib.parse import unquote

from app.core.dependencies import (
    get_clip_service,
    get_current_user,
)
from app.models.clip import ClipOperationRequest
from app.models.user import UserSession
from app.services.clip_service import ClipService
from fastapi import (
    APIRouter,
    Depends,
    Request,
)

router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("")
async def get_clips(
    user: UserSession = Depends(get_current_user),
    filter_by_serial: bool = False,
    clip_svc: ClipService = Depends(get_clip_service),
):
    return await clip_svc.get_clips(user.jwt_token, filter_by_serial)


@router.get("/video/{clip_id}")
async def get_clip_video(
    request: Request,
    clip_id: str,
    user: UserSession = Depends(get_current_user),
    clip_svc: ClipService = Depends(get_clip_service),
):
    return await clip_svc.get_clip_video(
        unquote(clip_id), user.jwt_token, request.headers.get("Range"),
    )


@router.get("/thumbnail/{clip_id}")
async def get_clip_thumbnail(
    request: Request,
    clip_id: str,
    user: UserSession = Depends(get_current_user),
    clip_svc: ClipService = Depends(get_clip_service),
):
    return await clip_svc.get_clip_thumbnail(
        unquote(clip_id), user.jwt_token, request.headers.get("If-None-Match"),
    )


@router.post("/save")
async def save_clip(
    request: ClipOperationRequest,
    user: UserSession = Depends(get_current_user),
    clip_svc: ClipService = Depends(get_clip_service),
):
    return await clip_svc.save_clip(request.clip_name, user.jwt_token)


@router.post("/delete")
async def delete_clip(
    request: ClipOperationRequest,
    user: UserSession = Depends(get_current_user),
    clip_svc: ClipService = Depends(get_clip_service),
):
    return await clip_svc.delete_clip(request.clip_name, user.jwt_token)
