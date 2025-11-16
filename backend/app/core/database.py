import logging
from contextlib import contextmanager
from typing import Generator
from urllib.parse import urlparse

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import logging
from sqlalchemy.orm import Session, scoped_session
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings  # Use absolute import for stability

# --------------------------------------------------
# Logging Setup
# --------------------------------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# --------------------------------------------------
# Validate DATABASE_URL
# --------------------------------------------------
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
parsed_url = urlparse(SQLALCHEMY_DATABASE_URL)
if not all([parsed_url.scheme, parsed_url.hostname, parsed_url.path]):
    raise ValueError("Invalid DATABASE_URL format. Please check your .env file.")

# --------------------------------------------------
# Build connect_args safely (no duplicate sslmode)
# --------------------------------------------------
connect_args = {
    "connect_timeout": 10,
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5,
}

# If DATABASE_URL already contains sslmode, do NOT add it again
if "sslmode" not in SQLALCHEMY_DATABASE_URL and "supabase" in SQLALCHEMY_DATABASE_URL:
    connect_args["sslmode"] = "require"

# --------------------------------------------------
# Database Engine Configuration
# --------------------------------------------------
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_size=10,            # Default 5 → bumped for better concurrency
    max_overflow=20,         # Allow extra connections beyond pool_size
    pool_timeout=10,         # Short timeout for faster failover
    pool_recycle=1800,       # Recycle every 30 min for managed DBs (Supabase default 1h)
    pool_pre_ping=True,      # Health check before using a connection
    echo=settings.DEBUG,     # Logs queries in dev, silent in prod
)

# --------------------------------------------------
# Session Factory
# --------------------------------------------------
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionScoped = scoped_session(SessionFactory)

# --------------------------------------------------
# Base Model Class
# --------------------------------------------------
Base = declarative_base()

# --------------------------------------------------
# Dependency for FastAPI Routes
# --------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """Provide a database session for dependency injection"""
    db = SessionScoped()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        SessionScoped.remove()

# --------------------------------------------------
# Context Manager for Manual Usage
# --------------------------------------------------
@contextmanager
def session_scope():
    """Provide a transactional scope for custom scripts/services."""
    session = SessionScoped()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
        SessionScoped.remove()

# --------------------------------------------------
# Initialize Database Tables
# --------------------------------------------------
def init_db():
    """Initialize database tables from models."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

# --------------------------------------------------
# Test Database Connection
# --------------------------------------------------
def test_connection():
    """Quick health check for DB connection."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            if result.scalar() == 1:
                logger.info("✅ Database connection successful")
                return True
            else:
                logger.error("❌ Database connection test query failed")
                return False
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return False
