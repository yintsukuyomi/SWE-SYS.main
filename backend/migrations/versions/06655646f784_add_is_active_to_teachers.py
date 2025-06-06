"""add is_active to teachers

Revision ID: 06655646f784
Revises: 8496821cbaf1
Create Date: 2025-05-13 02:32:55.395350

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '06655646f784'
down_revision = '8496821cbaf1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('users_backup')
    op.add_column('classrooms', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.drop_column('courses', 'department')
    op.add_column('teachers', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.drop_column('teachers', 'unavailable_times')
    op.alter_column('users', 'id',
               existing_type=sa.INTEGER(),
               nullable=False,
               autoincrement=True)
    op.alter_column('users', 'username',
               existing_type=sa.TEXT(),
               nullable=True)
    op.alter_column('users', 'password_hash',
               existing_type=sa.TEXT(),
               nullable=True)
    op.alter_column('users', 'role',
               existing_type=sa.TEXT(),
               nullable=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.drop_column('users', 'department')
    op.drop_column('users', 'faculty')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('faculty', sa.TEXT(), nullable=True))
    op.add_column('users', sa.Column('department', sa.TEXT(), nullable=True))
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.alter_column('users', 'role',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('users', 'password_hash',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('users', 'username',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('users', 'id',
               existing_type=sa.INTEGER(),
               nullable=True,
               autoincrement=True)
    op.add_column('teachers', sa.Column('unavailable_times', sqlite.JSON(), server_default=sa.text("'[]'"), nullable=True))
    op.drop_column('teachers', 'is_active')
    op.add_column('courses', sa.Column('department', sa.VARCHAR(), nullable=True))
    op.drop_column('classrooms', 'is_active')
    op.create_table('users_backup',
    sa.Column('id', sa.INTEGER(), nullable=True),
    sa.Column('username', sa.TEXT(), nullable=True),
    sa.Column('password_hash', sa.TEXT(), nullable=True),
    sa.Column('role', sa.TEXT(), nullable=True)
    )
    # ### end Alembic commands ### 