from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Configuration
    ranchbot_api_url: str
    dev_jwt_token: str = ""

    # Security
    secret_key: str = "your-secret-key-change-this-in-production"
    session_max_age: int = 86400  # 24 hours

    # CORS - will be split by comma if from env
    allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173,http://localhost:3000,http://127.0.0.1:8880,http://localhost:8880"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    enable_api_docs: bool = False

    # Cache directories
    thumbnail_cache_dir: str = "/tmp/thumbnails"
    adjusted_video_cache_dir: str = "/tmp/adjusted_videos"
    batch_video_cache_dir: str = "/tmp/batch_videos"

    # Maintenance settings
    maintenance_interval_seconds: int = 300
    thumbnail_cache_max_age_days: int = 7
    thumbnail_cache_max_size_mb: int = 500
    video_cache_max_age_hours: int = 1

    # Video stream cache (in-memory LRU for Range request support)
    video_stream_cache_max_entries: int = 50
    video_stream_cache_ttl_seconds: int = 300

    class Config:
        env_file = ".env"
        case_sensitive = False

    def get_allowed_origins(self) -> list[str]:
        """Get allowed origins as a list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()
