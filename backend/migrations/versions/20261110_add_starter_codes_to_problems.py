"""Add starter_codes to problems table."""
from alembic import op
import sqlalchemy as sa

revision = "20261110_starter_codes"
down_revision = "20261024_phase3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("problems", sa.Column("starter_codes", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("problems", "starter_codes")

