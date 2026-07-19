import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "gitupx-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = "sqlite:///./gitupx.db"

    GITHUB_TOKEN: Optional[str] = None
    GITHUB_USERNAME: Optional[str] = None

    WATCH_INTERVAL_SECONDS: int = 2
    NOTIFICATION_TIMEOUT_SECONDS: int = 30

    MODEL_PATH: str = "./models/gitupx_classifier.pkl"
    VECTORIZER_PATH: str = "./models/gitupx_vectorizer.pkl"

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/gitupx.log"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_root_dir(self) -> Path:
        return Path(__file__).resolve().parent.parent.parent

settings = Settings()
