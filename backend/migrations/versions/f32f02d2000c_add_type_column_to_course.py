"""add_type_column_to_course

Revision ID: f32f02d2000c
Revises: add_course_sessions
Create Date: 2025-05-11 15:30:06.123573

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f32f02d2000c'
down_revision = 'add_course_sessions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('courses', sa.Column('type', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('courses', 'type')
    # ### end Alembic commands ### 