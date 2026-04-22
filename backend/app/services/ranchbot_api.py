import httpx
from typing import Any, Dict, List, Optional

from app.core.config import settings


class RanchBotAPIClient:
    ALLOWED_ENDPOINTS = {
        'sz', 'w', 'ad', 'z', 'uk', 'mk', 'wys',
        'f', 'p', 'obj', 'e', 'odcinki',
        '/auth/login', '/auth/logout-all'
    }

    def __init__(self):
        self.base_url = settings.ranchbot_api_url
        self.default_token = settings.dev_jwt_token

    def _build_url(self, endpoint: str) -> str:
        normalized = endpoint.lstrip('/')
        if normalized not in self.ALLOWED_ENDPOINTS and endpoint not in self.ALLOWED_ENDPOINTS:
            raise ValueError(f"Endpoint '{endpoint}' is not allowed")
        return f"{self.base_url.rstrip('/')}/{normalized}"

    def _build_headers(self, token: str) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

    async def _make_request(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str],
        timeout: int
    ) -> httpx.Response:
        url = self._build_url(endpoint)
        jwt_token = token or self.default_token
        if not jwt_token:
            raise ValueError("JWT token is required")
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json={"args": args}, headers=self._build_headers(jwt_token))
            response.raise_for_status()
            return response

    async def call_api(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        response = await self._make_request(endpoint, args, token, timeout)
        return response.json()

    async def call_api_for_blob(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str] = None,
        timeout: int = 60
    ) -> bytes:
        response = await self._make_request(endpoint, args, token, timeout)
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

    async def search_clips(self, query: str, token: str) -> List[Dict[str, Any]]:
        result = await self.call_api("sz", [query], token)
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
