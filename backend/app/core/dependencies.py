from functools import lru_cache

from app.core.sessions import decode_session
from app.models.user import UserSession
from fastapi import (
    Cookie,
    HTTPException,
    status,
)


async def get_current_user(
    session_id: str | None = Cookie(None, alias="session_id"),
) -> UserSession:
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_session = decode_session(session_id)
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session",
        )
    return user_session


async def get_current_user_optional(
    session_id: str | None = Cookie(None, alias="session_id"),
) -> UserSession | None:
    if not session_id:
        return None
    return decode_session(session_id)


@lru_cache
def get_auth_service():
    from app.integrations.ranchbot import api_client
    from app.services.auth_service import AuthService
    return AuthService(api_client.auth)


@lru_cache
def get_clip_service():
    from app.integrations.ranchbot import api_client
    from app.services.clip_service import ClipService
    from app.services.thumbnail import thumbnail_service
    return ClipService(api_client.clips, thumbnail_service)


@lru_cache
def get_proxy_service():
    from app.integrations.ranchbot import api_client
    from app.services.adjusted_video import adjusted_video_service
    from app.services.proxy_service import ProxyService
    from app.services.thumbnail import thumbnail_service
    from app.services.video_cache import video_cache
    return ProxyService(api_client, video_cache, adjusted_video_service, thumbnail_service)
