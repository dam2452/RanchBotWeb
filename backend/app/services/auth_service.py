import base64
import json

from app.core.config import settings
from app.core.exceptions import (
    RanchBotAPIError,
    RanchBotAuthError,
    RanchBotConflictError,
    RanchBotRateLimitError,
)
from app.core.logger import setup_logger
from app.core.sessions import encode_session
from app.integrations.ranchbot.auth_api import RanchBotAuthAPI
from app.models.user import UserSession
from fastapi import HTTPException, Response, status

logger = setup_logger(__name__)


class AuthService:
    def __init__(self, auth_api: RanchBotAuthAPI) -> None:
        self._auth_api = auth_api

    @staticmethod
    def _decode_jwt_payload(token: str, fallback_username: str) -> tuple[int, str]:
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload = json.loads(base64.b64decode(parts[1] + "=="))
                return payload.get("user_id", 0), payload.get("username", fallback_username)
        except Exception:
            pass
        return 0, fallback_username

    def _build_login_response(self, response: Response, token: str, login: str) -> dict:
        user_id, username = self._decode_jwt_payload(token, login)
        user_session = UserSession(user_id=user_id, username=username, jwt_token=token)
        session_cookie = encode_session(user_session, max_age=settings.session_max_age)
        response.set_cookie(
            key="session_id",
            value=session_cookie,
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

    async def _attempt_login(self, login: str, password: str, response: Response) -> dict:
        auth_response = await self._auth_api.authenticate(login, password)
        if not auth_response or "access_token" not in auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
            )
        return self._build_login_response(response, auth_response["access_token"], login)

    async def login(self, login: str, password: str, response: Response) -> dict:
        try:
            logger.info(f"Attempting login for user: {login}")
            return await self._attempt_login(login, password, response)

        except RanchBotRateLimitError:
            logger.warning(f"Rate limit detected, clearing sessions for user: {login}")
            try:
                await self._auth_api.logout_all_sessions(login, password)
                logger.info("Sessions cleared, retrying login")
                return await self._attempt_login(login, password, response)
            except HTTPException:
                raise
            except Exception as retry_error:
                logger.error(f"Retry login failed: {retry_error}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Failed to login after clearing sessions",
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed",
            )

    async def register(
        self, username: str, password: str, full_name: str | None, response: Response,
    ) -> dict:
        try:
            api_response = await self._auth_api.register(username, password, full_name)
            if "access_token" not in api_response:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Registration failed: no token returned",
                )
            return self._build_login_response(response, api_response["access_token"], username)
        except HTTPException:
            raise
        except RanchBotConflictError as e:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.detail)
        except RanchBotAPIError as e:
            logger.error(f"Registration error for '{username}': {e.detail}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

    async def forgot_password(self, username: str) -> dict:
        try:
            result = await self._auth_api.forgot_password(username)
            return {
                "status": "success",
                "message": result.get("message", "Reset code sent if account exists."),
            }
        except RanchBotAPIError as e:
            logger.error(f"Forgot password error for '{username}': {e.detail}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

    async def reset_password(self, username: str, code: str, new_password: str) -> dict:
        try:
            result = await self._auth_api.reset_password(username, code, new_password)
            return {
                "status": "success",
                "message": result.get("message", "Password reset successfully."),
            }
        except RanchBotAPIError as e:
            logger.error(f"Reset password error for '{username}': {e.detail}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

    async def link_telegram(self, jwt_token: str, username: str) -> dict:
        try:
            result = await self._auth_api.link_telegram(jwt_token)
            return {
                "status": "success",
                "linking_code": result.get("linking_code"),
                "message": result.get("message"),
            }
        except RanchBotAPIError as e:
            logger.error(f"Link Telegram error for user '{username}': {e.detail}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

    async def change_password(self, jwt_token: str, username: str, old_password: str, new_password: str) -> dict:
        try:
            await self._auth_api.change_password(jwt_token, old_password, new_password)
            return {"status": "success", "message": "Password changed successfully."}
        except RanchBotAuthError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect.",
            )
        except RanchBotAPIError as e:
            logger.error(f"Change password error for user '{username}': {e.detail}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

    async def logout_all(self, login: str, password: str) -> dict:
        try:
            result = await self._auth_api.logout_all_sessions(login, password)
            return {
                "status": "success",
                "message": result.get("message", "Logged out from all sessions"),
                "revoked_count": result.get("revoked_count", 0),
            }
        except RanchBotAuthError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
            )
        except RanchBotAPIError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to logout from all sessions: {e.detail}",
            )


