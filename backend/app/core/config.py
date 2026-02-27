from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings
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

    # Security / Auth
    SECRET_KEY: SecretStr = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TOKEN_AUDIENCE: str = "ovi-client"
    TOKEN_ISSUER: str = "ovi.api"
    
    # Database & security
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    SECURE_HEADERS: bool = True

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_BACKEND: str = "memory"  # Options: "memory", "redis"
    RATE_LIMIT_CALLS_PER_MINUTE: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_REDIS_URL: Optional[str] = None

    # CORS
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
        "exp://*"
    ])
    CORS_ALLOW_CREDENTIALS: bool = True
    TRUSTED_HOSTS: List[str] = Field(default_factory=lambda: [
        "localhost",
        "127.0.0.1",
        "0.0.0.0"
    ])
    
    @field_validator("TRUSTED_HOSTS", mode="before")
    @classmethod
    def assemble_trusted_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        # Note: In Pydantic v2, we can't access other field values in validators
        # So we'll just parse the value as-is
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["localhost", "127.0.0.1", "0.0.0.0"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
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
    GEMINI_API_KEY: str = ""  # Deprecated, kept for backward compatibility
    GEMINI_FOOD_API_KEY: str = ""
    GEMINI_CHATBOT_API_KEY: str = ""

    # AI / Gemini configuration
    GEMINI_DEFAULT_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: int = 20
    GEMINI_MAX_RETRIES: int = 2
    GEMINI_COOL_DOWN_SECONDS: int = 30
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v.upper()

    # API Documentation
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "validate_assignment": True,
        "extra": "ignore",  # Ignore extra fields in .env
    }


# Global settings instance
try:
    settings = Settings()
except Exception as e:
    import sys
    print(f"❌ Environment variable error: {e}")
    sys.exit(1)
