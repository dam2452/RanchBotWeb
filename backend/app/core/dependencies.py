from fastapi import Cookie, HTTPException, status
from typing import Optional
from app.core.sessions import session_store
from app.models.user import UserSession


async def get_current_user(
    session_id: Optional[str] = Cookie(None, alias="session_id")
) -> UserSession:
    """Get current user from session cookie"""
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    user_session = session_store.get_session(session_id)
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )

    return user_session


async def get_current_user_optional(
    session_id: Optional[str] = Cookie(None, alias="session_id")
) -> Optional[UserSession]:
    """Get current user from session cookie (optional)"""
    if not session_id:
        return None

    return session_store.get_session(session_id)
