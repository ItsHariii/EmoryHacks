"""add_chat_logs_and_user_verification

Revision ID: 103f665c298c
Revises: f1a2b3c4d5e6
Create Date: 2025-11-29 01:11:35.218756

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '103f665c298c'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create chat_logs table
    op.create_table('chat_logs',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_logs_user_id'), 'chat_logs', ['user_id'], unique=False)

    # Add verification fields to users table
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('verification_token', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove verification fields from users table
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'is_verified')

    # Drop chat_logs table
    op.drop_index(op.f('ix_chat_logs_user_id'), table_name='chat_logs')
    op.drop_table('chat_logs')
