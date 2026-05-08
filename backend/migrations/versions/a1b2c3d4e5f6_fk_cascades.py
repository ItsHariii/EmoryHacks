"""fk_cascades

Add ON DELETE CASCADE / RESTRICT to FoodLog and ChatLog foreign keys so user
deletion cleans up dependent rows and food deletion is blocked while logs
reference the food.

Tolerates DBs where the chat_logs table was never materialized (e.g. when
the schema was bootstrapped via SQLAlchemy create_all on an older revision).

Revision ID: a1b2c3d4e5f6
Revises: f3a1d9e8b2c5
Create Date: 2026-05-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f3a1d9e8b2c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Postgres auto-generated FK names from the original autogenerate runs.
FOOD_LOGS_USER_FK = "food_logs_user_id_fkey"
FOOD_LOGS_FOOD_FK = "food_logs_food_id_fkey"
CHAT_LOGS_USER_FK = "chat_logs_user_id_fkey"


def _has_table(table: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return insp.has_table(table)


def _has_constraint(table: str, name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return any(fk.get("name") == name for fk in insp.get_foreign_keys(table))


def _replace_fk(
    name: str,
    table: str,
    referent: str,
    local_col: str,
    *,
    ondelete: str,
) -> None:
    if _has_constraint(table, name):
        op.drop_constraint(name, table, type_="foreignkey")
    op.create_foreign_key(
        name,
        table,
        referent,
        [local_col],
        ["id"],
        ondelete=ondelete,
    )


def upgrade() -> None:
    if _has_table("food_logs"):
        _replace_fk(FOOD_LOGS_USER_FK, "food_logs", "users", "user_id", ondelete="CASCADE")
        _replace_fk(FOOD_LOGS_FOOD_FK, "food_logs", "foods", "food_id", ondelete="RESTRICT")

    if not _has_table("chat_logs"):
        # ChatLog table was missing — create it from the model definition so
        # the rest of the chain has something to alter. The index=True on
        # user_id auto-creates ix_chat_logs_user_id, so we don't double-create.
        op.create_table(
            "chat_logs",
            sa.Column("id", UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "user_id",
                UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE", name=CHAT_LOGS_USER_FK),
                nullable=False,
                index=True,
            ),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
    else:
        _replace_fk(CHAT_LOGS_USER_FK, "chat_logs", "users", "user_id", ondelete="CASCADE")


def downgrade() -> None:
    if _has_table("chat_logs") and _has_constraint("chat_logs", CHAT_LOGS_USER_FK):
        op.drop_constraint(CHAT_LOGS_USER_FK, "chat_logs", type_="foreignkey")
        op.create_foreign_key(
            CHAT_LOGS_USER_FK,
            "chat_logs",
            "users",
            ["user_id"],
            ["id"],
        )

    if _has_table("food_logs"):
        if _has_constraint("food_logs", FOOD_LOGS_FOOD_FK):
            op.drop_constraint(FOOD_LOGS_FOOD_FK, "food_logs", type_="foreignkey")
            op.create_foreign_key(
                FOOD_LOGS_FOOD_FK,
                "food_logs",
                "foods",
                ["food_id"],
                ["id"],
            )

        if _has_constraint("food_logs", FOOD_LOGS_USER_FK):
            op.drop_constraint(FOOD_LOGS_USER_FK, "food_logs", type_="foreignkey")
            op.create_foreign_key(
                FOOD_LOGS_USER_FK,
                "food_logs",
                "users",
                ["user_id"],
                ["id"],
            )
