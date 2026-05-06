import io
import re
from urllib.parse import quote

from fastapi import Response
from fastapi.responses import StreamingResponse

_RANGE_PATTERN = re.compile(r"^bytes=(\d*)-(\d*)$")
_CHUNK_SIZE = 2 * 1024 * 1024  # 2 MB max per range response


def video_streaming_response(data: bytes, filename: str | None = None) -> StreamingResponse:
    disposition = f"inline; filename*=UTF-8''{quote(filename)}.mp4" if filename else "inline"
    return StreamingResponse(
        io.BytesIO(data),
        media_type="video/mp4",
        headers={
            "Content-Disposition": disposition,
            "Content-Length": str(len(data)),
            "Accept-Ranges": "bytes",
        },
    )


def range_video_response(
    data: bytes,
    range_header: str | None,
    content_type: str = "video/mp4",
) -> Response:
    total = len(data)

    if not range_header:
        return Response(
            content=data,
            media_type=content_type,
            status_code=200,
            headers={
                "Content-Length": str(total),
                "Accept-Ranges": "bytes",
                "Cache-Control": "no-cache",
            },
        )

    match = _RANGE_PATTERN.match(range_header.strip())
    if not match:
        return Response(
            status_code=416,
            headers={"Content-Range": f"bytes */{total}"},
        )

    start_str, end_str = match.group(1), match.group(2)
    start = int(start_str) if start_str else 0
    end = int(end_str) if end_str else total - 1
    end = min(end, start + _CHUNK_SIZE - 1, total - 1)

    if start > end or start >= total:
        return Response(
            status_code=416,
            headers={"Content-Range": f"bytes */{total}"},
        )

    return Response(
        content=data[start : end + 1],
        media_type=content_type,
        status_code=206,
        headers={
            "Content-Range": f"bytes {start}-{end}/{total}",
            "Content-Length": str(end - start + 1),
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
        },
    )


def thumbnail_response(
    data: bytes,
    etag: str,
    media_type: str = "image/webp",
) -> Response:
    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Content-Length": str(len(data)),
            "Cache-Control": "no-cache",
            "ETag": f'"{etag}"',
        },
    )


def thumbnail_not_modified_response(etag: str) -> Response:
    return Response(
        status_code=304,
        headers={"ETag": f'"{etag}"'},
    )
