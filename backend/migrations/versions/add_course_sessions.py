"""Add course sessions

Revision ID: add_course_sessions
Revises: 573d3e6f55ac
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'add_course_sessions'
down_revision = '573d3e6f55ac'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if table exists before creating
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = inspector.get_table_names()
    
    if 'course_sessions' not in tables:
        # Create course_sessions table
        op.create_table(
            'course_sessions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('course_id', sa.Integer(), nullable=True),
            sa.Column('type', sa.String(), nullable=True),
            sa.Column('hours', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_course_sessions_id'), 'course_sessions', ['id'], unique=False)

    # Check if old columns exist before migrating data
    columns = [col['name'] for col in inspector.get_columns('courses')]
    if 'type' in columns and 'total_hours' in columns:
        # Migrate existing data
        courses = connection.execute(text('SELECT id, type, total_hours FROM courses')).fetchall()
        
        for course in courses:
            if course.type and course.total_hours:
                connection.execute(
                    text('INSERT INTO course_sessions (course_id, type, hours) VALUES (:course_id, :type, :hours)'),
                    {'course_id': course.id, 'type': course.type, 'hours': course.total_hours}
                )

        # Remove old columns
        op.drop_column('courses', 'type')
        op.drop_column('courses', 'total_hours')


def downgrade() -> None:
    # Add back the old columns
    op.add_column('courses', sa.Column('type', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('total_hours', sa.Integer(), nullable=True))

    # Migrate data back
    connection = op.get_bind()
    courses = connection.execute(text('SELECT course_id, type, hours FROM course_sessions')).fetchall()
    
    for course in courses:
        connection.execute(
            text('UPDATE courses SET type = :type, total_hours = :hours WHERE id = :course_id'),
            {'type': course.type, 'hours': course.hours, 'course_id': course.course_id}
        )

    # Drop the course_sessions table
    op.drop_index(op.f('ix_course_sessions_id'), table_name='course_sessions')
    op.drop_table('course_sessions') 