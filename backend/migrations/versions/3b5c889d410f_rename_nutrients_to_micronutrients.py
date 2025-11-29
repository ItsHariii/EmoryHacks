"""rename_nutrients_to_micronutrients

Revision ID: 3b5c889d410f
Revises: 204a778d309e
Create Date: 2025-11-29 01:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3b5c889d410f'
down_revision = '204a778d309e'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('foods', 'nutrients', new_column_name='micronutrients')


def downgrade():
    op.alter_column('foods', 'micronutrients', new_column_name='nutrients')
