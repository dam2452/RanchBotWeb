import httpx
from typing import Any, Dict, List, Optional

from app.core.config import settings


class RanchBotAPIClient:
    ALLOWED_ENDPOINTS = {
        'sz', 'szf', 'sensklatki', 'kf', 'w', 'ad', 'z', 'uk', 'mk', 'wys', 'serial',
        'f', 'p', 'obj', 'e', 'odcinki',
        'klatka', 'frame', 'kl',
        '/auth/login', '/auth/logout-all', '/auth/register',
        '/auth/forgot-password', '/auth/reset-password', '/auth/link-telegram',
    }

    def __init__(self):
        self.base_url = settings.ranchbot_api_url
        self.default_token = settings.dev_jwt_token

    def _build_url(self, endpoint: str) -> str:
        normalized = endpoint.lstrip('/')
        if normalized not in self.ALLOWED_ENDPOINTS and endpoint not in self.ALLOWED_ENDPOINTS:
            raise ValueError(f"Endpoint '{endpoint}' is not allowed")
        return f"{self.base_url.rstrip('/')}/{normalized}"

    @staticmethod
    def _build_headers(token: str) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

    @staticmethod
    def _extract_api_error(response: httpx.Response) -> str:
        try:
            return response.json().get("detail", f"HTTP {response.status_code}")
        except Exception:
            return f"HTTP {response.status_code}"

    async def _make_request(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str],
        timeout: int,
        reply_json: bool = True,
    ) -> httpx.Response:
        url = self._build_url(endpoint)
        jwt_token = token or self.default_token
        if not jwt_token:
            raise ValueError("JWT token is required")
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                url,
                json={"args": args, "reply_json": reply_json},
                headers=self._build_headers(jwt_token),
            )
            response.raise_for_status()
            return response

    async def call_api(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        response = await self._make_request(endpoint, args, token, timeout, reply_json=True)
        return response.json()

    async def call_api_for_blob(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str] = None,
        timeout: int = 60
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

    async def authenticate(self, login: str, password: str) -> Dict[str, Any]:
        url = self._build_url("/auth/login")
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

    async def logout_all_sessions(self, login: str, password: str) -> Dict[str, Any]:
        url = self._build_url("/auth/logout-all")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"username": login, "password": password})
            response.raise_for_status()
            return response.json()

    async def register(
        self,
        username: str,
        password: str,
        full_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        url = self._build_url("/auth/register")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"username": username, "password": password, "full_name": full_name},
            )
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def forgot_password(self, username: str) -> Dict[str, Any]:
        url = self._build_url("/auth/forgot-password")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"username": username})
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def reset_password(self, username: str, code: str, new_password: str) -> Dict[str, Any]:
        url = self._build_url("/auth/reset-password")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"username": username, "code": code, "new_password": new_password},
            )
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def link_telegram(self, jwt_token: str) -> Dict[str, Any]:
        url = self._build_url("/auth/link-telegram")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers={"Authorization": f"Bearer {jwt_token}"})
            if not response.is_success:
                raise Exception(self._extract_api_error(response))
            return response.json()

    async def search_clips(self, query: str, token: str) -> List[Dict[str, Any]]:
        result = await self.call_api("szf", [query], token)
        if result and result.get("data") and result["data"].get("results"):
            return result["data"]["results"]
        return []

    async def get_video(self, index: str, token: str) -> bytes:
        return await self.call_api_for_blob("w", [index], token)

    async def adjust_video(
        self,
        clip_index: str,
        left_adjust: int,
        right_adjust: int,
        token: str
    ) -> bytes:
        return await self.call_api_for_blob("ad", [clip_index, str(left_adjust), str(right_adjust)], token)

    async def save_clip(self, clip_name: str, token: str) -> Dict[str, Any]:
        return await self.call_api("z", [clip_name], token)

    async def delete_clip(self, clip_name: str, token: str) -> Dict[str, Any]:
        return await self.call_api("uk", [clip_name], token)

    async def get_user_clips(self, token: str) -> List[Dict[str, Any]]:
        result = await self.call_api("mk", [], token)
        if result and result.get("status") == "success":
            return result.get("data", {}).get("clips", [])
        return []


api_client = RanchBotAPIClient()
