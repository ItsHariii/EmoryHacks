from pydantic import BaseSettings, Field, SecretStr, validator
from enum import Enum
from typing import List, Union, Optional


class Environment(str, Enum):
    DEV = "development"
    STAGING = "staging"
    PROD = "production"


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Ovi Pregnancy Nutrition API"
    DEBUG: bool = True
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: Environment = Environment.DEV

    # Security
    SECRET_KEY: SecretStr = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    SECURE_HEADERS: bool = True

    # CORS
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: [
        "http://localhost:3000",
        "http://localhost:19006",
        "exp://*"
    ])
    CORS_ALLOW_CREDENTIALS: bool = True
    TRUSTED_HOSTS: List[str] = Field(default_factory=lambda: [
        "localhost",
        "127.0.0.1",
        "0.0.0.0"
    ])
    
    @validator("TRUSTED_HOSTS", pre=True)
    def assemble_trusted_hosts(cls, v: Union[str, List[str]], values: dict) -> List[str]:
        if values.get("ENVIRONMENT") == Environment.PROD:
            # In production, only allow specific hosts
            if isinstance(v, str):
                return [i.strip() for i in v.split(",") if i.strip()]
            return v if isinstance(v, list) else []
        else:
            # In development, allow localhost variants
            return ["localhost", "127.0.0.1", "0.0.0.0"]

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # Supabase
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_KEY: SecretStr = Field(..., env="SUPABASE_KEY")

    # External APIs
    USDA_API_KEY: str = ""
    SPOONACULAR_API_KEY: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    @validator("LOG_LEVEL")
    def validate_log_level(cls, v: str) -> str:
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v.upper()

    # API Documentation
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"

    @validator("DOCS_URL", "REDOC_URL", pre=True)
    def disable_docs_in_production(cls, v: str, values: dict) -> Optional[str]:
        if values.get("ENVIRONMENT") == Environment.PROD:
            return None
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        validate_assignment = True


# Global settings instance
try:
    settings = Settings()
except Exception as e:
    import sys
    print(f"❌ Environment variable error: {e}")
    sys.exit(1)
