from typing import Any

from app.core.config import settings
from app.core.logger import setup_logger
import httpx

logger = setup_logger(__name__)


class Endpoints:
    SEARCH = "sz"
    SEARCH_PHRASE = "szf"
    SEARCH_SEMANTIC_FRAMES = "sensklatki"
    SEARCH_WITH_FILTERS = "kf"
    VIDEO_BY_INDEX = "w"
    VIDEO_ADJUST = "ad"
    CLIP_SAVE = "z"
    CLIP_SAVE_BY_INDEX = "zn"
    CLIP_DELETE = "uk"
    CLIP_LIST = "mk"
    CLIP_SEND = "wys"
    FRAME = "klatka"
    FRAME_ALT = "frame"
    FRAME_SHORT = "kl"
    CLIP_THUMBNAIL = "kk"
    FILTERS = "f"
    SERIES = "serial"
    SEASONS = "p"
    EPISODES = "odcinki"
    OBJECTS = "obj"
    EMOTIONS = "e"

    AUTH_LOGIN = "/auth/login"
    AUTH_LOGOUT_ALL = "/auth/logout-all"
    AUTH_REGISTER = "/auth/register"
    AUTH_FORGOT_PASSWORD = "/auth/forgot-password"
    AUTH_RESET_PASSWORD = "/auth/reset-password"
    AUTH_LINK_TELEGRAM = "/auth/link-telegram"
    AUTH_ATTACH_CREDENTIALS = "/auth/attach-credentials"


class RanchBotAPIClient:
    ALLOWED_ENDPOINTS = {
        Endpoints.SEARCH,
        Endpoints.SEARCH_PHRASE,
        Endpoints.SEARCH_SEMANTIC_FRAMES,
        Endpoints.SEARCH_WITH_FILTERS,
        Endpoints.VIDEO_BY_INDEX,
        Endpoints.VIDEO_ADJUST,
        Endpoints.CLIP_SAVE,
        Endpoints.CLIP_SAVE_BY_INDEX,
        Endpoints.CLIP_DELETE,
        Endpoints.CLIP_LIST,
        Endpoints.CLIP_SEND,
        Endpoints.FRAME,
        Endpoints.FRAME_ALT,
        Endpoints.FRAME_SHORT,
        Endpoints.CLIP_THUMBNAIL,
        Endpoints.FILTERS,
        Endpoints.SERIES,
        Endpoints.SEASONS,
        Endpoints.EPISODES,
        Endpoints.OBJECTS,
        Endpoints.EMOTIONS,
        Endpoints.AUTH_LOGIN,
        Endpoints.AUTH_LOGOUT_ALL,
        Endpoints.AUTH_REGISTER,
        Endpoints.AUTH_FORGOT_PASSWORD,
        Endpoints.AUTH_RESET_PASSWORD,
        Endpoints.AUTH_LINK_TELEGRAM,
        Endpoints.AUTH_ATTACH_CREDENTIALS,
    }

    def __init__(self):
        self.base_url = settings.ranchbot_api_url
        self.default_token = settings.dev_jwt_token

    def _build_url(self, endpoint: str) -> str:
        normalized = endpoint.lstrip("/")
        if normalized not in self.ALLOWED_ENDPOINTS and endpoint not in self.ALLOWED_ENDPOINTS:
            raise ValueError(f"Endpoint '{endpoint}' is not allowed")
        return f"{self.base_url.rstrip('/')}/{normalized}"

    @staticmethod
    def _build_headers(token: str) -> dict[str, str]:
        return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    @staticmethod
    def _extract_api_error(response: httpx.Response) -> str:
        try:
            return response.json().get("detail", f"HTTP {response.status_code}")
        except Exception:
            return f"HTTP {response.status_code}"

    async def _make_request(
        self,
        endpoint: str,
        args: list[Any],
        token: str | None,
        timeout: int,
        reply_json: bool = True,
    ) -> httpx.Response:
        url = self._build_url(endpoint)
        jwt_token = token or self.default_token
        if not jwt_token:
            raise ValueError("JWT token is required")
        logger.debug("API call: endpoint=%r args=%r url=%s", endpoint, args, url)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                url,
                json={"args": args, "reply_json": reply_json},
                headers=self._build_headers(jwt_token),
            )
            logger.debug("API response: endpoint=%r status=%d", endpoint, response.status_code)
            response.raise_for_status()
            return response

    async def call_api(
        self, endpoint: str, args: list[Any], token: str | None = None, timeout: int = 60,
    ) -> dict[str, Any]:
        response = await self._make_request(endpoint, args, token, timeout, reply_json=True)
        return response.json()

    async def call_api_for_blob(
        self, endpoint: str, args: list[Any], token: str | None = None, timeout: int = 60,
    ) -> bytes:
        response = await self._make_request(endpoint, args, token, timeout, reply_json=False)
        if not response.content:
            raise ValueError(f"Empty response from '{endpoint}'")
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                error_data = response.json()
                detail = (
                    error_data.get("detail")
                    or error_data.get("message")
                    or error_data.get("content")
                    or str(error_data)
                )
            except Exception:
                detail = response.text[:200]
            raise ValueError(f"Expected binary response from '{endpoint}', got JSON: {detail}")
        return response.content

    async def authenticate(self, login: str, password: str) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_LOGIN)
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"username": login, "password": password})

            if response.status_code == 429:
                try:
                    error_detail = response.json().get("detail", "Too many active sessions")
                except Exception:
                    error_detail = "Too many active sessions"
                raise Exception(f"Rate limit: {error_detail}")

            response.raise_for_status()

            if not response.content:
                raise Exception("Empty response from authentication API")

            try:
                return response.json()
            except Exception:
                raise Exception(f"Invalid JSON response from authentication API: {response.text}")

    async def logout_all_sessions(self, login: str, password: str) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_LOGOUT_ALL)
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"username": login, "password": password})
            response.raise_for_status()
            return response.json()

    async def register(
        self,
        username: str,
        password: str,
        full_name: str | None = None,
    ) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_REGISTER)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"username": username, "password": password, "full_name": full_name},
            )
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def forgot_password(self, username: str) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_FORGOT_PASSWORD)
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"username": username})
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def reset_password(self, username: str, code: str, new_password: str) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_RESET_PASSWORD)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"username": username, "code": code, "new_password": new_password},
            )
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def link_telegram(self, jwt_token: str) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_LINK_TELEGRAM)
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers={"Authorization": f"Bearer {jwt_token}"})
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def attach_credentials(self, token: str, username: str, password: str) -> dict[str, Any]:
        url = self._build_url(Endpoints.AUTH_ATTACH_CREDENTIALS)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"token": token, "username": username, "password": password},
            )
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def search_clips(self, query: str, token: str) -> list[dict[str, Any]]:
        result = await self.call_api(Endpoints.SEARCH_PHRASE, [query], token)
        if result and result.get("data") and result["data"].get("results"):
            return result["data"]["results"]
        return []

    async def get_video(self, index: str, token: str) -> bytes:
        return await self.call_api_for_blob(Endpoints.VIDEO_BY_INDEX, [index], token)

    async def adjust_video(
        self, clip_index: str, left_adjust: int, right_adjust: int, token: str,
    ) -> bytes:
        return await self.call_api_for_blob(
            Endpoints.VIDEO_ADJUST, [clip_index, str(left_adjust), str(right_adjust)], token,
        )

    async def save_clip(self, clip_name: str, token: str) -> dict[str, Any]:
        return await self.call_api(Endpoints.CLIP_SAVE, [clip_name], token)

    async def save_clip_by_index(
        self,
        index: int,
        clip_name: str,
        token: str,
        left_adj: float = 0,
        right_adj: float = 0,
    ) -> dict[str, Any]:
        args = [str(index)]
        if left_adj != 0 or right_adj != 0:
            args.extend([str(left_adj), str(right_adj)])
        args.append(clip_name)
        return await self.call_api(Endpoints.CLIP_SAVE_BY_INDEX, args, token)

    async def get_saved_clip_thumbnail(self, clip_name: str, token: str) -> bytes:
        return await self.call_api_for_blob(Endpoints.CLIP_THUMBNAIL, [clip_name], token)

    async def delete_clip(self, clip_name: str, token: str) -> dict[str, Any]:
        return await self.call_api(Endpoints.CLIP_DELETE, [clip_name], token)

    async def get_user_clips(self, token: str, filter_by_serial: bool = False) -> list[dict[str, Any]]:
        args = ["serial"] if filter_by_serial else []
        result = await self.call_api(Endpoints.CLIP_LIST, args, token)
        if result and result.get("status") == "success":
            return result.get("data", {}).get("clips", [])
        return []


api_client = RanchBotAPIClient()
