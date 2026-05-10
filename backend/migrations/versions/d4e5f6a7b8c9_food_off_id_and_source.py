"""add off_id column and open_food_facts to foodsource enum

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Postgres requires ALTER TYPE ... ADD VALUE for enum extension; cannot
    # run inside a transaction in older PG versions. Alembic >=1.7 handles
    # this with op.execute autocommit, but we keep it explicit here.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE foodsource ADD VALUE IF NOT EXISTS 'open_food_facts'")

    op.add_column(
        "foods",
        sa.Column("off_id", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_foods_off_id", "foods", ["off_id"])


def downgrade() -> None:
    op.drop_index("ix_foods_off_id", table_name="foods")
    op.drop_column("foods", "off_id")
    # Postgres has no DROP VALUE on an enum; downgrade leaves the value in
    # place. Acceptable: orphan enum value is harmless without rows using it.
