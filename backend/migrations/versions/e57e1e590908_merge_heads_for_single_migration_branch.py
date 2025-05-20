"""merge heads for single migration branch

Revision ID: e57e1e590908
Revises: 06655646f784, 33d8e40a0696, b39c1d5875b5
Create Date: 2025-05-20 11:52:00.079347

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e57e1e590908'
down_revision = ('06655646f784', '33d8e40a0696', 'b39c1d5875b5')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 