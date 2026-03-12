from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str
    ENVIRONMENT: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    DATABASE_URL: str
    ALLOWED_ORIGINS: List[str]
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET: str
    LIVEKIT_URL: str
    LOG_DIR: str = "logs"
    API_PORT: int
    DB_PORTL int
    DB_INTERNAL_PORT: int
    ADMIN_PORT: int
    POSTGRES_USER=postgres_adm: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DB_INTERNAL_PORT: int
    API_PORT: int
    DB_PORT: int
    ADMIN_PORT: int

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
