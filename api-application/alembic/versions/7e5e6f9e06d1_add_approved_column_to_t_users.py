"""add approved column to t_users

Revision ID: 7e5e6f9e06d1
Revises: 55ed6db665de
Create Date: 2026-02-12 17:17:51.802317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7e5e6f9e06d1'
down_revision: Union[str, None] = '55ed6db665de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        't_user',
        sa.Column('approved', sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    op.drop_column('t_user', 'approved')