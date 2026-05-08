"""indexes_softdelete

- Composite indexes on food_logs covering daily/weekly summary queries.
- Soft-delete (deleted_at) on foods, users, journal_entries.
  ChatLog stays hard-delete on purpose (PII, no need to retain).

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Composite indexes on food_logs.
    op.create_index(
        "ix_food_logs_user_consumed",
        "food_logs",
        ["user_id", "consumed_at"],
    )
    op.create_index(
        "ix_food_logs_user_active_consumed",
        "food_logs",
        ["user_id", "deleted_at", "consumed_at"],
    )

    # Soft-delete columns.
    op.add_column(
        "foods",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_foods_deleted_at", "foods", ["deleted_at"])

    op.add_column(
        "users",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_deleted_at", "users", ["deleted_at"])

    op.add_column(
        "journal_entries",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_journal_entries_deleted_at", "journal_entries", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("ix_journal_entries_deleted_at", table_name="journal_entries")
    op.drop_column("journal_entries", "deleted_at")

    op.drop_index("ix_users_deleted_at", table_name="users")
    op.drop_column("users", "deleted_at")

    op.drop_index("ix_foods_deleted_at", table_name="foods")
    op.drop_column("foods", "deleted_at")

    op.drop_index("ix_food_logs_user_active_consumed", table_name="food_logs")
    op.drop_index("ix_food_logs_user_consumed", table_name="food_logs")
