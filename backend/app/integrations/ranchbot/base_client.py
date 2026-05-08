from contextlib import asynccontextmanager
from typing import Any

from app.core.config import settings
from app.core.exceptions import (
    RanchBotAPIError,
    RanchBotAuthError,
)
from app.core.logger import setup_logger
from app.integrations.ranchbot.endpoints import Endpoints
import httpx

logger = setup_logger(__name__)


class RanchBotBaseClient:
    def __init__(self) -> None:
        self._base_url = settings.ranchbot_api_url
        self._default_token = settings.dev_jwt_token
        self._shared_client: httpx.AsyncClient | None = None

    def set_shared_client(self, client: httpx.AsyncClient | None) -> None:
        self._shared_client = client

    def _build_url(self, endpoint: str) -> str:
        normalized = endpoint.lstrip("/")
        if normalized not in Endpoints.ALLOWED and endpoint not in Endpoints.ALLOWED:
            raise ValueError(f"Endpoint '{endpoint}' is not allowed")
        return f"{self._base_url.rstrip('/')}/{normalized}"

    @staticmethod
    def _build_headers(token: str) -> dict[str, str]:
        return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    @staticmethod
    def _extract_api_error(response: httpx.Response) -> str:
        try:
            return response.json().get("detail", f"HTTP {response.status_code}")
        except Exception:
            return f"HTTP {response.status_code}"

    @asynccontextmanager
    async def _client_context(self, timeout: int):
        if self._shared_client:
            yield self._shared_client
        else:
            async with httpx.AsyncClient(timeout=timeout) as client:
                yield client

    async def _make_request(
        self,
        endpoint: str,
        args: list[Any],
        token: str | None,
        timeout: int,
        reply_json: bool = True,
    ) -> httpx.Response:
        url = self._build_url(endpoint)
        jwt_token = token or self._default_token
        if not jwt_token:
            raise ValueError("JWT token is required")
        logger.debug("API call: endpoint=%r args=%r url=%s", endpoint, args, url)
        async with self._client_context(timeout) as client:
            response = await client.post(
                url,
                json={"args": args, "reply_json": reply_json},
                headers=self._build_headers(jwt_token),
            )
        logger.debug("API response: endpoint=%r status=%d", endpoint, response.status_code)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise RanchBotAuthError("API token expired or invalid") from e
            raise RanchBotAPIError(
                self._extract_api_error(e.response), status_code=e.response.status_code,
            ) from e
        return response

    async def call_api(
        self, endpoint: str, args: list[Any], token: str | None = None, timeout: int = 60,
    ) -> dict[str, Any]:
        return (await self._make_request(endpoint, args, token, timeout, reply_json=True)).json()

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

    async def call_batch(
        self, commands: list[dict[str, Any]], token: str | None = None, timeout: int = 60,
    ) -> dict[str, Any]:
        url = self._build_url(Endpoints.BATCH)
        jwt_token = token or self._default_token
        if not jwt_token:
            raise ValueError("JWT token is required")
        logger.debug("Batch API call: %d commands url=%s", len(commands), url)
        async with self._client_context(timeout) as client:
            response = await client.post(
                url,
                json={"commands": commands},
                headers=self._build_headers(jwt_token),
            )
        logger.debug("Batch API response: status=%d", response.status_code)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise RanchBotAuthError("API token expired or invalid") from e
            raise RanchBotAPIError(
                self._extract_api_error(e.response), status_code=e.response.status_code,
            ) from e
        return response.json()
