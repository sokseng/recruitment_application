"""remove cover_letter_file column from t_candidate_resume

Revision ID: a8b643dd7992
Revises: 05953b8933d3
Create Date: 2026-03-02 13:20:22.889480

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8b643dd7992'
down_revision: Union[str, None] = '05953b8933d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_column('t_candidate_resume', 'cover_letter_file')


def downgrade():
    op.add_column(
        't_candidate_resume',
        sa.Column('cover_letter_file', sa.String(), nullable=True)
    )
