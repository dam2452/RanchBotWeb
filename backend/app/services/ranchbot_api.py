import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings


class RanchBotAPIClient:
    def __init__(self):
        self.base_url = settings.ranchbot_api_url
        self.default_token = settings.dev_jwt_token

    async def call_api(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """Call RanchBot API with JSON response"""
        url = f"{self.base_url}/{endpoint}"
        jwt_token = token or self.default_token

        if not jwt_token:
            raise ValueError("JWT token is required")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}"
        }

        payload = {"args": args}

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    async def call_api_for_blob(
        self,
        endpoint: str,
        args: List[Any],
        token: Optional[str] = None,
        timeout: int = 60
    ) -> bytes:
        """Call RanchBot API with binary response (video)"""
        url = f"{self.base_url}/{endpoint}"
        jwt_token = token or self.default_token

        if not jwt_token:
            raise ValueError("JWT token is required")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}"
        }

        payload = {"args": args}

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.content

    async def authenticate(self, login: str, password: str) -> Dict[str, Any]:
        """Authenticate user and get JWT token"""
        url = f"{self.base_url}/auth/login"

        payload = {
            "username": login,  # External API expects 'username', we receive 'login'
            "password": password
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    async def search_clips(self, query: str, token: str) -> List[Dict[str, Any]]:
        """Search for clips"""
        result = await self.call_api("sz", [query], token)
        if result and result.get("data") and result["data"].get("results"):
            return result["data"]["results"]
        return []

    async def get_video(self, index: str, token: str) -> bytes:
        """Get video blob"""
        return await self.call_api_for_blob("w", [index], token)

    async def adjust_video(
        self,
        clip_index: str,
        left_adjust: int,
        right_adjust: int,
        token: str
    ) -> bytes:
        """Adjust video timing"""
        return await self.call_api_for_blob(
            "d",
            [clip_index, str(left_adjust), str(right_adjust)],
            token
        )

    async def save_clip(self, clip_name: str, token: str) -> Dict[str, Any]:
        """Save clip"""
        return await self.call_api("z", [clip_name], token)

    async def delete_clip(self, clip_name: str, token: str) -> Dict[str, Any]:
        """Delete clip"""
        return await self.call_api("uk", [clip_name], token)

    async def get_user_clips(self, token: str) -> List[Dict[str, Any]]:
        """Get user's clips"""
        result = await self.call_api("mk", [], token)
        if result and result.get("status") == "success":
            return result.get("data", {}).get("clips", [])
        return []


# Singleton instance
api_client = RanchBotAPIClient()
