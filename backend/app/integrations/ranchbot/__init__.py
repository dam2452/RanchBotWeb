from typing import Any

from app.integrations.ranchbot.auth_api import RanchBotAuthAPI
from app.integrations.ranchbot.base_client import RanchBotBaseClient
from app.integrations.ranchbot.clips_api import RanchBotClipsAPI
from app.integrations.ranchbot.endpoints import Endpoints
import httpx


class RanchBotClient:
    def __init__(self) -> None:
        self._base = RanchBotBaseClient()
        self.auth = RanchBotAuthAPI(self._base)
        self.clips = RanchBotClipsAPI(self._base)

    def set_shared_client(self, client: httpx.AsyncClient | None) -> None:
        self._base.set_shared_client(client)

    async def call_api(
        self, endpoint: str, args: list[Any], token: str | None = None, timeout: int = 60,
    ) -> dict[str, Any]:
        return await self._base.call_api(endpoint, args, token, timeout)

    async def call_api_for_blob(
        self, endpoint: str, args: list[Any], token: str | None = None, timeout: int = 60,
    ) -> bytes:
        return await self._base.call_api_for_blob(endpoint, args, token, timeout)

    async def call_batch(
        self, commands: list[dict[str, Any]], token: str | None = None, timeout: int = 60,
    ) -> dict[str, Any]:
        return await self._base.call_batch(commands, token, timeout)


api_client = RanchBotClient()

__all__ = ["RanchBotClient", "RanchBotAuthAPI", "RanchBotClipsAPI", "Endpoints", "api_client"]
