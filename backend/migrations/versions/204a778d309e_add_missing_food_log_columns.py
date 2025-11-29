"""add_missing_food_log_columns

Revision ID: 204a778d309e
Revises: 103f665c298c
Create Date: 2025-11-29 01:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '204a778d309e'
down_revision = '103f665c298c'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to food_logs table
    op.add_column('food_logs', sa.Column('serving_size', sa.Float(), nullable=False, server_default='100.0'))
    op.add_column('food_logs', sa.Column('serving_unit', sa.String(length=20), nullable=False, server_default='g'))
    op.add_column('food_logs', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('food_logs', sa.Column('calories_logged', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('food_logs', sa.Column('nutrients_logged', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Remove server defaults after creation for columns that shouldn't have them permanently if not needed
    op.alter_column('food_logs', 'serving_size', server_default=None)
    op.alter_column('food_logs', 'serving_unit', server_default=None)
    # calories_logged keeps default 0.0 as per model


def downgrade():
    op.drop_column('food_logs', 'nutrients_logged')
    op.drop_column('food_logs', 'calories_logged')
    op.drop_column('food_logs', 'deleted_at')
    op.drop_column('food_logs', 'serving_unit')
    op.drop_column('food_logs', 'serving_size')
