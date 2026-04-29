import base64
import json
import traceback

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.logger import setup_logger
from app.core.sessions import session_store
from app.models.user import UserSession
from app.services.ranchbot_api import api_client
from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Response,
    status,
)
from pydantic import (
    BaseModel,
    Field,
)

logger = setup_logger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


class RegisterBody(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = None


class ForgotPasswordBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)


class ResetPasswordBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


def _decode_jwt_payload(token: str, fallback_username: str) -> tuple[int, str]:
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            payload = json.loads(base64.b64decode(parts[1] + "=="))
            return payload.get("user_id", 0), payload.get("username", fallback_username)
    except Exception:
        pass
    return 0, fallback_username


def _finalize_login(response: Response, token: str, login: str) -> dict:
    user_id, username = _decode_jwt_payload(token, login)

    user_session = UserSession(user_id=user_id, username=username, jwt_token=token)
    session_id = session_store.create_session(user_session, max_age=settings.session_max_age)

    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=settings.session_max_age,
        httponly=True,
        samesite="lax",
    )

    return {
        "status": "success",
        "user": {
            "id": user_id,
            "username": username,
            "telegram_linked": user_id > 0,
        },
    }


@router.post("/login")
async def login(response: Response, login: str = Form(...), password: str = Form(...)):
    try:
        logger.info(f"Attempting login for user: {login}")
        auth_response = await api_client.authenticate(login, password)
        logger.debug(f"Auth response: {auth_response}")

        if not auth_response or "access_token" not in auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
            )

        return _finalize_login(response, auth_response["access_token"], login)

    except HTTPException:
        raise
    except Exception as e:
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
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
                    )

                return _finalize_login(response, auth_response["access_token"], login)
            except HTTPException:
                raise
            except Exception as retry_error:
                logger.error(f"Retry login failed: {retry_error}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Failed to login after clearing sessions",
                )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed",
        )


@router.post("/register")
async def register(data: RegisterBody, response: Response):
    try:
        api_response = await api_client.register(data.username, data.password, data.full_name)

        if "access_token" not in api_response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed: no token returned",
            )

        return _finalize_login(response, api_response["access_token"], data.username)

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Registration error for '{data.username}': {error_msg}")

        if "telegram_linked" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="telegram_linked")
        if "already taken" in error_msg.lower() or "409" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username already taken",
            )

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordBody):
    try:
        result = await api_client.forgot_password(data.username)
        return {
            "status": "success",
            "message": result.get("message", "Reset code sent if account exists."),
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Forgot password error for '{data.username}': {error_msg}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.post("/reset-password")
async def reset_password(data: ResetPasswordBody):
    try:
        result = await api_client.reset_password(data.username, data.code, data.new_password)
        return {
            "status": "success",
            "message": result.get("message", "Password reset successfully."),
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Reset password error for '{data.username}': {error_msg}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.post("/link-telegram")
async def link_telegram(user: UserSession = Depends(get_current_user)):
    try:
        result = await api_client.link_telegram(user.jwt_token)
        return {
            "status": "success",
            "linking_code": result.get("linking_code"),
            "message": result.get("message"),
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Link Telegram error for user '{user.username}': {error_msg}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.get("/logout")
async def logout(response: Response, user: UserSession = Depends(get_current_user)):
    response.delete_cookie(key="session_id")
    return {"status": "success", "message": "Logged out"}


@router.post("/logout-all")
async def logout_all(login: str = Form(...), password: str = Form(...)):
    try:
        result = await api_client.logout_all_sessions(login, password)
        return {
            "status": "success",
            "message": result.get("message", "Logged out from all sessions"),
            "revoked_count": result.get("revoked_count", 0),
        }
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to logout from all sessions: {error_msg}",
        )


@router.get("/user")
async def get_user(user: UserSession = Depends(get_current_user)):
    return {
        "status": "success",
        "user": {
            "id": user.user_id,
            "username": user.username,
            "email": "",
            "telegram_linked": user.user_id > 0,
        },
    }
