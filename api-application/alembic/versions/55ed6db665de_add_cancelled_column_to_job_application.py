"""Add cancelled column to job_application

Revision ID: 55ed6db665de
Revises: 
Create Date: 2026-02-12 16:00:06.740337

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '55ed6db665de'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add cancelled column to t_job_application."""
    op.add_column(
        't_job_application',
        sa.Column('cancelled', sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    """Remove cancelled column from t_job_application."""
    op.drop_column('t_job_application', 'cancelled')
    # ### end Alembic commands ###
