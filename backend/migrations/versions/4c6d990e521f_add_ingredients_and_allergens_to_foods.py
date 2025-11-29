"""add_ingredients_and_allergens_to_foods

Revision ID: 4c6d990e521f
Revises: 3b5c889d410f
Create Date: 2025-11-29 01:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4c6d990e521f'
down_revision = '3b5c889d410f'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('foods', sa.Column('ingredients', sa.ARRAY(sa.Text()), nullable=True))
    op.add_column('foods', sa.Column('allergens', sa.ARRAY(sa.Text()), nullable=True))


def downgrade():
    op.drop_column('foods', 'allergens')
    op.drop_column('foods', 'ingredients')
