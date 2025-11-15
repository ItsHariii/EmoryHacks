"""Create journal_entries table

Revision ID: f1a2b3c4d5e6
Revises: 8a9b7c6d5e4f
Create Date: 2025-11-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = '8a9b7c6d5e4f'
branch_labels = None
depends_on = None


def upgrade():
    # Create the journal_entries table
    op.create_table(
        'journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('symptoms', postgresql.ARRAY(sa.String()), nullable=True, server_default='{}'),
        sa.Column('mood', sa.Integer(), nullable=True),
        sa.Column('cravings', sa.Text(), nullable=True),
        sa.Column('sleep_quality', sa.Integer(), nullable=True),
        sa.Column('energy_level', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        
        # Primary key
        sa.PrimaryKeyConstraint('id'),
        
        # Foreign key to users table
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        
        # Check constraints for rating scales
        sa.CheckConstraint('mood >= 1 AND mood <= 5', name='ck_journal_mood_range'),
        sa.CheckConstraint('sleep_quality >= 1 AND sleep_quality <= 5', name='ck_journal_sleep_quality_range'),
        sa.CheckConstraint('energy_level >= 1 AND energy_level <= 5', name='ck_journal_energy_level_range'),
    )
    
    # Create indexes for efficient querying
    op.create_index('ix_journal_entries_user_id', 'journal_entries', ['user_id'])
    op.create_index('ix_journal_entries_entry_date', 'journal_entries', ['entry_date'])
    op.create_index('ix_journal_entries_user_date', 'journal_entries', ['user_id', 'entry_date'], unique=False)


def downgrade():
    # Drop the table
    op.drop_index('ix_journal_entries_user_date', table_name='journal_entries')
    op.drop_index('ix_journal_entries_entry_date', table_name='journal_entries')
    op.drop_index('ix_journal_entries_user_id', table_name='journal_entries')
    op.drop_table('journal_entries')
