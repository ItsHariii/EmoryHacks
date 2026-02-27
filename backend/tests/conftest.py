"""Test configuration and fixtures."""
import pytest
import asyncio
import os
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Fix for SQLite UUID compatibility
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy import ARRAY
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import CHAR, JSON, TypeDecorator
from sqlalchemy import Enum as SQLEnum
import uuid
import sqlalchemy.dialects.postgresql
import json

# Monkeypatch UUID to handle SQLite
class SQLiteUUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def __init__(self, as_uuid=True, **kwargs):
        self.as_uuid = as_uuid
        super().__init__(**kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            try:
                return uuid.UUID(value)
            except ValueError:
                return value
        return value

# Monkeypatch ARRAY to handle SQLite (map to JSON/Text)
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.types import TypeDecorator, CHAR, Text

class SQLiteArray(TypeDecorator):
    impl = Text
    cache_ok = True

    def __init__(self, item_type=None, as_tuple=False, dimensions=None, zero_indexes=False):
        super().__init__()
        self.item_type = item_type

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_ARRAY(self.item_type))
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except ValueError:
                return []
        return value

# Monkeypatch JSONB to handle SQLite (map to JSON/Text)
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
class SQLiteJSON(TypeDecorator):
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except ValueError:
                return {}
        return value

# Patch types before importing models
sqlalchemy.dialects.postgresql.UUID = SQLiteUUID
sqlalchemy.dialects.postgresql.ARRAY = SQLiteArray
sqlalchemy.dialects.postgresql.JSONB = SQLiteJSON

# Also patch generic ARRAY since some models use it directly
import sqlalchemy.sql.sqltypes
sqlalchemy.sql.sqltypes.ARRAY = SQLiteArray
sqlalchemy.ARRAY = SQLiteArray

@compiles(SQLiteUUID, "sqlite")
def compile_uuid(type_, compiler, **kw):
    return "CHAR(36)"

@compiles(SQLiteArray, "sqlite")
def compile_array(type_, compiler, **kw):
    return "JSON"

@compiles(SQLiteJSON, "sqlite")
def compile_jsonb(type_, compiler, **kw):
    return "JSON"

@compiles(SQLEnum, "sqlite")
@compiles(ENUM, "sqlite")
def compile_enum(type_, compiler, **kw):
    return "VARCHAR(50)"

# No sqlite3 adapters needed as SQLAlchemy JSON type handles it

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token

# Import all models to ensure they're registered with SQLAlchemy
from app.models.user import User
from app.models.food import Food, FoodLog
from app.models.ingredient import Ingredient


# Test database configuration
def get_test_database_url():
    """Get test database URL - use SQLite for tests to avoid network issues."""
    return "sqlite:///./test.db"


TEST_DATABASE_URL = get_test_database_url()

# Create test engine
if "sqlite" in TEST_DATABASE_URL:
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
else:
    engine = create_engine(
        TEST_DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
    )

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)





@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Clean up tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    from datetime import date, timedelta
    
    user = User(
        email="test@example.com",
        password_hash=get_password_hash("testpassword"),
        first_name="Test",
        last_name="User",
        due_date=date.today() + timedelta(days=180),
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Get authentication headers for test user."""
    access_token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_food(db_session):
    """Create a test food item."""
    from app.models.food import FoodSource, FoodSafetyStatus
    
    food = Food(
        name="Test Apple",
        description="A test apple for testing",
        category="Fruits",
        brand="Test Brand",
        serving_size=100.0,
        serving_unit="g",
        calories=52.0,
        protein=0.3,
        carbs=14.0,
        fat=0.2,
        fiber=2.4,
        sugar=10.4,
        source=FoodSource.MANUAL,
        safety_status=FoodSafetyStatus.SAFE
    )
    db_session.add(food)
    db_session.commit()
    db_session.refresh(food)
    return food


@pytest.fixture
def test_ingredient(db_session):
    """Create a test ingredient."""
    from app.models.ingredient import IngredientSource, PregnancySafety
    
    ingredient = Ingredient(
        name="Test Ingredient",
        description="A test ingredient",
        category="Test Category",
        source=IngredientSource.MANUAL,
        pregnancy_safety=PregnancySafety.SAFE,
        safety_notes="Safe for testing"
    )
    db_session.add(ingredient)
    db_session.commit()
    db_session.refresh(ingredient)
    return ingredient
