"""add cover letter file columns to t_job_application

Revision ID: 5e0184f8b289
Revises: a8b643dd7992
Create Date: 2026-03-02 13:25:22.017449

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e0184f8b289'
down_revision: Union[str, None] = 'a8b643dd7992'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        't_job_application',
        sa.Column('cover_letter_file', sa.String(length=255), nullable=True)
    )
    op.add_column(
        't_job_application',
        sa.Column('cover_letter_original', sa.String(length=255), nullable=True)
    )
    op.add_column(
        't_job_application',
        sa.Column('cover_letter_size', sa.BigInteger(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('t_job_application', 'cover_letter_size')
    op.drop_column('t_job_application', 'cover_letter_original')
    op.drop_column('t_job_application', 'cover_letter_file')
