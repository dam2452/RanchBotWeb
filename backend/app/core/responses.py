import io
from typing import Optional
from urllib.parse import quote

from fastapi import Response
from fastapi.responses import StreamingResponse


def video_streaming_response(data: bytes, filename: Optional[str] = None) -> StreamingResponse:
    disposition = f"inline; filename*=UTF-8''{quote(filename)}.mp4" if filename else "inline"
    return StreamingResponse(
        io.BytesIO(data),
        media_type="video/mp4",
        headers={
            "Content-Disposition": disposition,
            "Content-Length": str(len(data)),
            "Accept-Ranges": "bytes"
        }
    )


def thumbnail_response(data: bytes, cacheable: bool = True, media_type: str = "image/webp") -> Response:
    headers: dict[str, str] = {"Content-Length": str(len(data))}
    if cacheable:
        headers["Cache-Control"] = "public, max-age=86400"
    else:
        headers["Cache-Control"] = "no-store"
    return Response(
        content=data,
        media_type=media_type,
        headers=headers
    )
