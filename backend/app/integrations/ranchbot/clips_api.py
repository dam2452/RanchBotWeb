from typing import Any

from app.integrations.ranchbot.base_client import RanchBotBaseClient
from app.integrations.ranchbot.endpoints import Endpoints


class RanchBotClipsAPI:
    def __init__(self, base: RanchBotBaseClient) -> None:
        self._base = base

    async def get_user_clips(
        self, token: str, filter_by_serial: bool = False,
    ) -> list[dict[str, Any]]:
        args = ["serial"] if filter_by_serial else []
        result = await self._base.call_api(Endpoints.CLIP_LIST, args, token)
        if result and result.get("status") == "success":
            return result.get("data", {}).get("clips", [])
        return []

    async def get_clip_video(self, clip_name: str, token: str) -> bytes:
        return await self._base.call_api_for_blob(Endpoints.CLIP_SEND, [clip_name], token)

    async def get_video_by_index(self, index: str, token: str) -> bytes:
        return await self._base.call_api_for_blob(Endpoints.VIDEO_BY_INDEX, [index], token)

    async def adjust_video(
        self, clip_index: str, left_adjust: int, right_adjust: int, token: str,
    ) -> bytes:
        return await self._base.call_api_for_blob(
            Endpoints.VIDEO_ADJUST, [clip_index, str(left_adjust), str(right_adjust)], token,
        )

    async def get_saved_clip_thumbnail(self, clip_name: str, token: str) -> bytes:
        return await self._base.call_api_for_blob(Endpoints.CLIP_THUMBNAIL, [clip_name], token)

    async def save_clip(self, clip_name: str, token: str) -> dict[str, Any]:
        return await self._base.call_api(Endpoints.CLIP_SAVE, [clip_name], token)

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
        return await self._base.call_api(Endpoints.CLIP_SAVE_BY_INDEX, args, token)

    async def delete_clip(self, clip_name: str, token: str) -> dict[str, Any]:
        return await self._base.call_api(Endpoints.CLIP_DELETE, [clip_name], token)

    async def search_clips(self, query: str, token: str) -> list[dict[str, Any]]:
        result = await self._base.call_api(Endpoints.SEARCH_PHRASE, [query], token)
        if result and result.get("data") and result["data"].get("results"):
            return result["data"]["results"]
        return []
