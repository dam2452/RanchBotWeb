from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, proxy, clips
import asyncio
import os
import time
from contextlib import asynccontextmanager


async def cleanup_cache_task():
    """Background task to cleanup old cache files periodically"""
    while True:
        await asyncio.sleep(settings.maintenance_interval_seconds)
        try:
            print("[Cleanup] Running cache cleanup...")
            now = time.time()

            for cache_dir in [settings.thumbnail_cache_dir, settings.adjusted_video_cache_dir]:
                if not os.path.exists(cache_dir):
                    continue

                max_age = settings.video_cache_max_age_hours * 3600
                removed = 0

                for filename in os.listdir(cache_dir):
                    filepath = os.path.join(cache_dir, filename)
                    if os.path.isfile(filepath):
                        age = now - os.path.getmtime(filepath)
                        if age > max_age:
                            os.remove(filepath)
                            removed += 1

                if removed > 0:
                    print(f"[Cleanup] Removed {removed} old files from {cache_dir}")

        except Exception as e:
            print(f"[Cleanup] Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_task = asyncio.create_task(cleanup_cache_task())
    yield
    cleanup_task.cancel()


app = FastAPI(
    title="RanchBot API",
    description="Backend API for RanchBot application",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(proxy.router)
app.include_router(clips.router)


@app.get("/")
async def root():
    return {
        "message": "RanchBot API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )
