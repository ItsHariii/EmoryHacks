"""add safety_verdict JSONB column on foods

Persists the layered SafetyVerdict so reads don't have to recompute the
verdict on every request. Also lets the Gemini layer-5 fallback (capped
at 0.5 confidence) cache its output on the row instead of re-firing.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "foods",
        sa.Column("safety_verdict", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("foods", "safety_verdict")
