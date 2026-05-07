from typing import Any

from app.core.exceptions import (
    RanchBotAPIError,
    RanchBotConflictError,
    RanchBotRateLimitError,
)
from app.integrations.ranchbot.base_client import RanchBotBaseClient
from app.integrations.ranchbot.endpoints import Endpoints


class RanchBotAuthAPI:
    def __init__(self, base: RanchBotBaseClient) -> None:
        self._base = base

    async def authenticate(self, login: str, password: str) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_LOGIN)
        async with self._base._client_context(30) as client:
            response = await client.post(url, json={"username": login, "password": password})

        if response.status_code == 429:
            try:
                detail = response.json().get("detail", "Too many active sessions")
            except Exception:
                detail = "Too many active sessions"
            raise RanchBotRateLimitError(detail)

        response.raise_for_status()

        if not response.content:
            raise RanchBotAPIError("Empty response from authentication API")

        try:
            return response.json()
        except Exception as e:
            raise RanchBotAPIError(
                f"Invalid JSON response from authentication API: {response.text}",
            ) from e

    async def logout_all_sessions(self, login: str, password: str) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_LOGOUT_ALL)
        async with self._base._client_context(30) as client:
            response = await client.post(url, json={"username": login, "password": password})
        response.raise_for_status()
        return response.json()

    async def register(
        self,
        username: str,
        password: str,
        full_name: str | None = None,
    ) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_REGISTER)
        async with self._base._client_context(30) as client:
            response = await client.post(
                url,
                json={"username": username, "password": password, "full_name": full_name},
            )
        if not response.is_success:
            detail = self._base._extract_api_error(response)
            if response.status_code == 409:
                raise RanchBotConflictError(detail)
            raise RanchBotAPIError(detail)
        return response.json()

    async def forgot_password(self, username: str) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_FORGOT_PASSWORD)
        async with self._base._client_context(30) as client:
            response = await client.post(url, json={"username": username})
        if not response.is_success:
            raise RanchBotAPIError(self._base._extract_api_error(response))
        return response.json()

    async def reset_password(self, username: str, code: str, new_password: str) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_RESET_PASSWORD)
        async with self._base._client_context(30) as client:
            response = await client.post(
                url,
                json={"username": username, "code": code, "new_password": new_password},
            )
        if not response.is_success:
            raise RanchBotAPIError(self._base._extract_api_error(response))
        return response.json()

    async def link_telegram(self, jwt_token: str) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_LINK_TELEGRAM)
        async with self._base._client_context(30) as client:
            response = await client.post(
                url, headers={"Authorization": f"Bearer {jwt_token}"},
            )
        if not response.is_success:
            raise RanchBotAPIError(self._base._extract_api_error(response))
        return response.json()

    async def attach_credentials(self, token: str, username: str, password: str) -> dict[str, Any]:
        url = self._base._build_url(Endpoints.AUTH_ATTACH_CREDENTIALS)
        async with self._base._client_context(30) as client:
            response = await client.post(
                url,
                json={"token": token, "username": username, "password": password},
            )
        if not response.is_success:
            raise RanchBotAPIError(self._base._extract_api_error(response))
        return response.json()
