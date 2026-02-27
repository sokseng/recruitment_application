"""add bio and profile_name to t_user

Revision ID: 05953b8933d3
Revises: a14f602a6211
Create Date: 2026-02-26 16:58:03.343718

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '05953b8933d3'
down_revision: Union[str, None] = 'a14f602a6211'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        't_user',
        sa.Column('bio', sa.Text(), nullable=True)
    )
    op.add_column(
        't_user',
        sa.Column('profile_image', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('t_user', 'profile_image')
    op.drop_column('t_user', 'bio')
