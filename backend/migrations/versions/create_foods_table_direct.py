"""Create foods table directly

Revision ID: create_foods_direct
Revises: 
Create Date: 2025-08-26 13:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_foods_direct'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types first
    op.execute("CREATE TYPE food_safety_status AS ENUM ('safe', 'limited', 'avoid')")
    op.execute("CREATE TYPE foodsource AS ENUM ('spoonacular', 'usda', 'manual')")
    
    # Create the foods table with optimized schema
    op.create_table(
        'foods',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('brand', sa.String(100), nullable=True),
        sa.Column('serving_size', sa.Float(), nullable=False),
        sa.Column('serving_unit', sa.String(20), nullable=False),
        sa.Column('calories', sa.Float(), nullable=False),
        
        # Macronutrients (for filtering/sorting)
        sa.Column('protein', sa.Float(), nullable=False, server_default='0'),
        sa.Column('carbs', sa.Float(), nullable=False, server_default='0'),
        sa.Column('fat', sa.Float(), nullable=False, server_default='0'),
        sa.Column('fiber', sa.Float(), nullable=True),
        sa.Column('sugar', sa.Float(), nullable=True),
        
        # Micronutrients and detailed data
        sa.Column('nutrients', postgresql.JSONB, nullable=False, server_default='{}'),
        
        # API Integration
        sa.Column('spoonacular_id', sa.String(100), nullable=True),
        sa.Column('fdc_id', sa.String(50), nullable=True),  # USDA FoodData Central ID
        
        # Safety Information
        sa.Column('safety_status', postgresql.ENUM('safe', 'limited', 'avoid', name='food_safety_status'), 
                 nullable=False, server_default='safe'),
        sa.Column('safety_notes', sa.Text(), nullable=True),
        sa.Column('usda_confidence', sa.Float(), nullable=True),
        
        # Metadata
        sa.Column('source', postgresql.ENUM('spoonacular', 'usda', 'manual', name='foodsource'),
                 nullable=False, server_default='manual'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        
        # Primary key
        sa.PrimaryKeyConstraint('id'),
        
        # Unique constraint
        sa.UniqueConstraint('name', 'brand', 'serving_size', 'serving_unit', name='uq_food_unique'),
    )
    
    # Create indexes
    op.create_index('ix_foods_name', 'foods', ['name'])
    op.create_index('ix_foods_brand', 'foods', ['brand'])
    op.create_index('ix_foods_category', 'foods', ['category'])
    op.create_index('ix_foods_fdc_id', 'foods', ['fdc_id'])
    op.create_index('ix_foods_spoonacular_id', 'foods', ['spoonacular_id'])

def downgrade():
    # Drop the table and types
    op.drop_table('foods')
    op.execute("DROP TYPE IF EXISTS food_safety_status")
    op.execute("DROP TYPE IF EXISTS foodsource")
