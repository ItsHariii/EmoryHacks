from sqlalchemy import Column, String, Date, Integer, Text, DateTime, ARRAY, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    symptoms = Column(ARRAY(String), default=list)
    mood = Column(Integer, CheckConstraint('mood >= 1 AND mood <= 5'), nullable=True)
    cravings = Column(Text, nullable=True)
    sleep_quality = Column(Integer, CheckConstraint('sleep_quality >= 1 AND sleep_quality <= 5'), nullable=True)
    energy_level = Column(Integer, CheckConstraint('energy_level >= 1 AND energy_level <= 5'), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="journal_entries")

    def __repr__(self):
        return f"<JournalEntry {self.id} - User {self.user_id} - {self.entry_date}>"
