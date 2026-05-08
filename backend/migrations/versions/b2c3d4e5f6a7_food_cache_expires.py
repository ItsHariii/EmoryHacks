"""food_cache_expires + unique partial indexes

Adds Food.cache_expires_at (with index) so cache validity is a column compare
instead of timestamp arithmetic. Also enforces uniqueness on the external API
identifiers so cache_service's `.first()` lookups can rely on at-most-one row.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-08
"""

from datetime import datetime, timedelta
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_indexes(table: str) -> set:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return {ix["name"] for ix in insp.get_indexes(table)}


def upgrade() -> None:
    op.add_column(
        "foods",
        sa.Column("cache_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_foods_cache_expires_at",
        "foods",
        ["cache_expires_at"],
    )

    # Backfill existing rows with a default 7-day expiry so freshly migrated
    # data isn't immediately treated as stale.
    backfill = datetime.utcnow() + timedelta(days=7)
    op.execute(
        sa.text(
            "UPDATE foods SET cache_expires_at = :expires "
            "WHERE cache_expires_at IS NULL"
        ).bindparams(expires=backfill)
    )

    existing = _existing_indexes("foods")

    # Drop the existing non-unique indexes (created in earlier migrations) so
    # we can replace them with unique partial indexes. Only drop if present —
    # DBs bootstrapped via create_all may use different index names.
    for legacy in ("ix_foods_spoonacular_id", "ix_foods_fdc_id"):
        if legacy in existing:
            op.drop_index(legacy, table_name="foods")

    op.create_index(
        "uq_foods_spoonacular_id",
        "foods",
        ["spoonacular_id"],
        unique=True,
        postgresql_where=sa.text("spoonacular_id IS NOT NULL"),
    )
    op.create_index(
        "uq_foods_fdc_id",
        "foods",
        ["fdc_id"],
        unique=True,
        postgresql_where=sa.text("fdc_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_foods_fdc_id", table_name="foods")
    op.drop_index("uq_foods_spoonacular_id", table_name="foods")

    op.create_index("ix_foods_fdc_id", "foods", ["fdc_id"])
    op.create_index("ix_foods_spoonacular_id", "foods", ["spoonacular_id"])

    op.drop_index("ix_foods_cache_expires_at", table_name="foods")
    op.drop_column("foods", "cache_expires_at")
