from sqlalchemy import Column, String, Date, Integer, Float, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import date, datetime, timedelta
import uuid

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    due_date = Column(Date, nullable=False)
    babies = Column(Integer, default=1)
    pre_pregnancy_weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    current_weight = Column(Float, nullable=True)
    blood_type = Column(String, nullable=True)
    allergies = Column(JSON, default=list)
    conditions = Column(JSON, default=list)
    dietary_preferences = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    food_logs = relationship("FoodLog", back_populates="user", cascade="all, delete")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete")

    def __repr__(self):
        return f"<User {self.email}>"

    @property
    def trimester(self) -> int:
        """Calculate current trimester based on due date."""
        today = date.today()
        weeks_pregnant = (today - (self.due_date - timedelta(weeks=40))).days // 7

        if weeks_pregnant < 13:
            return 1
        elif 13 <= weeks_pregnant < 27:
            return 2
        return 3
