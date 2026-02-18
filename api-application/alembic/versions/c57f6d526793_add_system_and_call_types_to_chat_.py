"""add system and call types to chat message

Revision ID: c57f6d526793
Revises: 7e5e6f9e06d1
Create Date: 2026-02-18 12:31:28.570621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c57f6d526793'
down_revision: Union[str, None] = '7e5e6f9e06d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'SYSTEM'")
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'CALL'")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
