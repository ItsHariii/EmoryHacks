"""add_onboarding_completed

Revision ID: f3a1d9e8b2c5
Revises: 9b2c1a7f6d10
Create Date: 2026-04-23

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3a1d9e8b2c5"
down_revision: Union[str, None] = "9b2c1a7f6d10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    # All rows that existed before this migration went through the
    # email/password RegistrationWizard and are considered complete.
    op.execute("UPDATE users SET onboarding_completed = TRUE")


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed")
