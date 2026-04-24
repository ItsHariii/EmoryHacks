"""add_supabase_user_id_and_nullable_password

Revision ID: 9b2c1a7f6d10
Revises: d65a598b5759
Create Date: 2026-03-31

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9b2c1a7f6d10"
down_revision: Union[str, None] = "d65a598b5759"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Allow social-login users without local passwords.
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=True)

    # Map Supabase Auth users ("sub") to local users.
    op.add_column("users", sa.Column("supabase_user_id", sa.String(), nullable=True))
    op.create_index(
        op.f("ix_users_supabase_user_id"),
        "users",
        ["supabase_user_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_supabase_user_id"), table_name="users")
    op.drop_column("users", "supabase_user_id")

    # Restore previous constraint.
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=False)

