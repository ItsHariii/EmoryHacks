"""Optimize foods table schema

Revision ID: 8a9b7c6d5e4f
Revises: e622866fe771
Create Date: 2025-08-26 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8a9b7c6d5e4f'
down_revision = 'e622866fe771'  # Points to the update_user_model migration
branch_labels = None
depends_on = None

def upgrade():
    # Drop existing tables and types if they exist to ensure clean state
    op.execute('DROP TABLE IF EXISTS food_logs CASCADE')
    op.execute('DROP TABLE IF EXISTS foods CASCADE')
    op.execute('DROP TYPE IF EXISTS food_safety_status CASCADE')
    op.execute('DROP TYPE IF EXISTS foodsource CASCADE')

    # Create the foods table with optimized schema
    op.create_table(
        'foods',
        sa.Column('id', sa.UUID(), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True, index=True),
        sa.Column('brand', sa.String(100), nullable=True, index=True),
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
        sa.Column('spoonacular_id', sa.String(100), nullable=True, index=True),
        sa.Column('fdc_id', sa.String(50), nullable=True, index=True),  # USDA FoodData Central ID
        
        # Safety Information
        sa.Column('safety_status', sa.Enum('safe', 'limited', 'avoid', name='food_safety_status'), 
                 nullable=False, server_default='safe'),
        sa.Column('safety_notes', sa.Text(), nullable=True),
        sa.Column('usda_confidence', sa.Float(), nullable=True),
        
        # Metadata
        sa.Column('source', sa.Enum('spoonacular', 'usda', 'manual', name='foodsource'),
                 nullable=False, server_default='manual'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), 
                 onupdate=sa.func.now(), nullable=False),
        
        # Constraints
        sa.UniqueConstraint('name', 'brand', 'serving_size', 'serving_unit', 
                          name='uq_food_unique'),
        sa.CheckConstraint("safety_status IN ('safe', 'limited', 'avoid')", 
                          name='ck_foods_safety_status'),
        sa.CheckConstraint("source IN ('spoonacular', 'usda', 'manual')", 
                          name='ck_foods_source'),
        
        # Add any additional indexes
    )
    
    # Create additional indexes
    # Note: Indexes for name, brand, fdc_id, spoonacular_id, category are created via index=True in create_table

    # Recreate food_logs table
    op.create_table('food_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('food_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('consumed_at', sa.DateTime(), nullable=False),
        sa.Column('meal_type', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['food_id'], ['foods.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_food_logs_food_id'), 'food_logs', ['food_id'], unique=False)
    op.create_index(op.f('ix_food_logs_user_id'), 'food_logs', ['user_id'], unique=False)

def downgrade():
    # Drop the table completely on downgrade
    op.drop_table('foods')
    
    # Drop the enum types
    op.execute("DROP TYPE IF EXISTS food_safety_status")
    op.execute("DROP TYPE IF EXISTS foodsource")
    op.execute("DROP TRIGGER IF EXISTS update_foods_updated_at ON foods;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop constraints and indexes
    op.drop_constraint('uq_food_unique', 'foods', type_='unique')
    op.drop_index(op.f('ix_foods_category'), table_name='foods')
    op.drop_index(op.f('ix_foods_spoonacular_id'), table_name='foods')
    op.drop_index(op.f('ix_foods_fdc_id'), table_name='foods')
    op.drop_index(op.f('ix_foods_brand'), table_name='foods')
    op.drop_index(op.f('ix_foods_name'), table_name='foods')
    
    # Drop added columns
    with op.batch_alter_table('foods') as batch_op:
        batch_op.drop_column('usda_confidence')
        batch_op.drop_column('spoonacular_id')
    
    # Recreate original indexes
    op.create_index('ix_foods_name', 'foods', ['name'], unique=False)
    op.create_index('ix_foods_fdc_id', 'foods', ['fdc_id'], unique=False)
    op.create_index('ix_foods_brand', 'foods', ['brand'], unique=False)
    
    # Recreate primary key
    op.create_primary_key('foods_pkey', 'foods', ['id'])
