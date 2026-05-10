"""User-submitted "this safety verdict is wrong" reports.

Audit trail for the layered pregnancy_safety_service. Rows stay around after
user deletion (FK SET NULL) so admins can still triage historical reports.
"""

from enum import Enum as PyEnum

import sqlalchemy as sa
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
import uuid

from app.core.database import Base


class SafetyReportStatus(str, PyEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    APPLIED = "applied"


class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    food_id = Column(
        UUID(as_uuid=True),
        ForeignKey("foods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Snapshot of the food name at report time — survives food deletion /
    # rename and lets admins reproduce what the user was actually looking at.
    food_name = Column(String(255), nullable=False)
    reported_status = Column(
        ENUM("safe", "limited", "avoid", name="food_safety_status", create_type=False),
        nullable=False,
    )
    suggested_status = Column(
        ENUM("safe", "limited", "avoid", name="food_safety_status", create_type=False),
        nullable=True,
    )
    reason = Column(Text, nullable=False)
    review_status = Column(
        ENUM(
            "pending", "reviewed", "dismissed", "applied",
            name="safety_report_status", create_type=False,
        ),
        nullable=False,
        server_default="pending",
    )
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<SafetyReport {self.food_name} {self.reported_status}→{self.suggested_status}>"
