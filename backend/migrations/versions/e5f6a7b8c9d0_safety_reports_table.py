"""create safety_reports table

User-submitted reports flagging an incorrect pregnancy safety classification.
Powers a future admin curation queue. Rows are kept on user delete (FK SET NULL)
so the audit trail survives.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STATUSES = ("pending", "reviewed", "dismissed", "applied")
_SAFETY_STATUSES = ("safe", "limited", "avoid")


def upgrade() -> None:
    review_status = ENUM(*_STATUSES, name="safety_report_status", create_type=False)
    review_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "safety_reports",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "food_id",
            UUID(as_uuid=True),
            sa.ForeignKey("foods.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("food_name", sa.String(length=255), nullable=False),
        sa.Column(
            "reported_status",
            sa.Enum(*_SAFETY_STATUSES, name="food_safety_status", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "suggested_status",
            sa.Enum(*_SAFETY_STATUSES, name="food_safety_status", create_type=False),
            nullable=True,
        ),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column(
            "review_status",
            sa.Enum(*_STATUSES, name="safety_report_status", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("reviewer_notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_safety_reports_review_status",
        "safety_reports",
        ["review_status"],
    )
    op.create_index(
        "ix_safety_reports_created_at",
        "safety_reports",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_safety_reports_created_at", table_name="safety_reports")
    op.drop_index("ix_safety_reports_review_status", table_name="safety_reports")
    op.drop_table("safety_reports")
    sa.Enum(*_STATUSES, name="safety_report_status").drop(op.get_bind(), checkfirst=True)
