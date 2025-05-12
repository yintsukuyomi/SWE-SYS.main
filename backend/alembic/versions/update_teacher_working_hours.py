"""update teacher working hours

Revision ID: update_teacher_working_hours
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_teacher_working_hours'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # working_days sütununu kaldır
    op.drop_column('teachers', 'working_days')
    
    # working_hours sütununu güncelle (eğer yoksa ekle)
    try:
        op.add_column('teachers', sa.Column('working_hours', sa.String(), nullable=True))
    except:
        pass

def downgrade():
    # working_days sütununu geri ekle
    op.add_column('teachers', sa.Column('working_days', sa.String(), nullable=True))
    
    # working_hours sütununu kaldır
    op.drop_column('teachers', 'working_hours') 