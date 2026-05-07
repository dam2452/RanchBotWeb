import asyncio
from contextlib import asynccontextmanager
import os
import time

from app.api.v1 import auth, clips, proxy
from app.core.config import settings
from app.core.exceptions import RanchBotAPIError
from app.core.logger import setup_logger
from app.integrations.ranchbot import api_client
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

logger = setup_logger(__name__)


def _cleanup_cache_dirs(cache_dirs: list[str], max_age_seconds: float) -> None:
    now = time.time()
    for cache_dir in cache_dirs:
        if not os.path.exists(cache_dir):
            continue
        removed = 0
        for filename in os.listdir(cache_dir):
            filepath = os.path.join(cache_dir, filename)
            if os.path.isfile(filepath) and now - os.path.getmtime(filepath) > max_age_seconds:
                os.remove(filepath)
                removed += 1
        if removed > 0:
            logger.info(f"[Cleanup] Removed {removed} old files from {cache_dir}")


async def _cleanup_cache_task() -> None:
    cache_dirs = [settings.thumbnail_cache_dir, settings.adjusted_video_cache_dir]
    max_age = settings.video_cache_max_age_hours * 3600
    loop = asyncio.get_running_loop()

    while True:
        await asyncio.sleep(settings.maintenance_interval_seconds)
        try:
            logger.info("[Cleanup] Running cache cleanup...")
            await loop.run_in_executor(None, _cleanup_cache_dirs, cache_dirs, max_age)
        except Exception as e:
            logger.error(f"[Cleanup] Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    http_client = httpx.AsyncClient()
    api_client.set_shared_client(http_client)
    cleanup_task = asyncio.create_task(_cleanup_cache_task())
    try:
        yield
    finally:
        cleanup_task.cancel()
        api_client.set_shared_client(None)
        await http_client.aclose()


app = FastAPI(
    title="RanchBot API",
    description="Backend API for RanchBot application",
    version="2.0.5",
    lifespan=lifespan,
    docs_url="/docs" if settings.enable_api_docs else None,
    redoc_url="/redoc" if settings.enable_api_docs else None,
    openapi_url="/openapi.json" if settings.enable_api_docs else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RanchBotAPIError)
async def ranchbot_api_error_handler(request: Request, exc: RanchBotAPIError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(auth.router, prefix="/api/v1")
app.include_router(clips.router, prefix="/api/v1")
app.include_router(proxy.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "RanchBot API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.reload)
