import base64
import json
from typing import Dict, Tuple

from fastapi import APIRouter, HTTPException, Response, Depends, status, Form

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.logger import setup_logger
from app.core.sessions import session_store
from app.models.user import UserSession
from app.services.ranchbot_api import api_client

logger = setup_logger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


def _decode_jwt_payload(token: str, fallback_username: str) -> Tuple[int, str]:
    try:
        parts = token.split('.')
        if len(parts) >= 2:
            payload = json.loads(base64.b64decode(parts[1] + '=='))
            return payload.get('user_id', 0), payload.get('username', fallback_username)
    except Exception:
        pass
    return 0, fallback_username


def _finalize_login(response: Response, token: str, login: str) -> Dict:
    user_id, username = _decode_jwt_payload(token, login)

    user_session = UserSession(user_id=user_id, username=username, jwt_token=token)
    session_id = session_store.create_session(user_session, max_age=settings.session_max_age)

    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=settings.session_max_age,
        httponly=True,
        samesite="lax"
    )

    return {"status": "success", "user": {"id": user_id, "username": username}}


@router.post("/login")
async def login(
    response: Response,
    login: str = Form(...),
    password: str = Form(...)
):
    try:
        logger.info(f"Attempting login for user: {login}")
        auth_response = await api_client.authenticate(login, password)
        logger.debug(f"Auth response: {auth_response}")

        if not auth_response or "access_token" not in auth_response:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return _finalize_login(response, auth_response["access_token"], login)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Login error: {e}")
        logger.debug(f"Traceback: {traceback.format_exc()}")

        error_msg = str(e)
        if "Rate limit" in error_msg or "Too many" in error_msg:
            logger.warning(f"Rate limit detected, clearing sessions for user: {login}")
            try:
                await api_client.logout_all_sessions(login, password)
                logger.info("Sessions cleared, retrying login")
                auth_response = await api_client.authenticate(login, password)

                if not auth_response or "access_token" not in auth_response:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

                return _finalize_login(response, auth_response["access_token"], login)
            except HTTPException:
                raise
            except Exception as retry_error:
                logger.error(f"Retry login failed: {retry_error}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Failed to login after clearing sessions"
                )

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")


@router.get("/logout")
async def logout(
    response: Response,
    user: UserSession = Depends(get_current_user)
):
    response.delete_cookie(key="session_id")
    return {"status": "success", "message": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    login: str = Form(...),
    password: str = Form(...)
):
    try:
        result = await api_client.logout_all_sessions(login, password)
        return {
            "status": "success",
            "message": result.get("message", "Logged out from all sessions"),
            "revoked_count": result.get("revoked_count", 0)
        }
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to logout from all sessions: {error_msg}"
        )


@router.get("/user")
async def get_user(user: UserSession = Depends(get_current_user)):
    return {
        "status": "success",
        "user": {"id": user.user_id, "username": user.username, "email": ""}
    }
