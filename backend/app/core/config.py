from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # API Configuration
    ranchbot_api_url: str = "http://localhost:8080/api/v1"
    dev_jwt_token: str = ""

    # Security
    secret_key: str = "your-secret-key-change-this-in-production"
    session_max_age: int = 86400  # 24 hours

    # CORS - will be split by comma if from env
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False

    def get_allowed_origins(self) -> List[str]:
        """Get allowed origins as a list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()
