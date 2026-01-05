from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str
    ENVIRONMENT: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    DATABASE_URL: str
    ALLOWED_ORIGINS: List[str]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
