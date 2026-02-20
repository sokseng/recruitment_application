"""add reason column to job_application

Revision ID: a14f602a6211
Revises: c57f6d526793
Create Date: 2026-02-20 15:48:41.822919

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a14f602a6211'
down_revision: Union[str, None] = 'c57f6d526793'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        't_job_application',
        sa.Column('reason', sa.String(255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('t_job_application', 'reason')