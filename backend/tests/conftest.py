import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base, get_db
from main import app
from models import Teacher, Classroom, Course, Schedule

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Drop all tables first
    Base.metadata.drop_all(bind=engine)
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new database session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.rollback()  # Rollback any pending changes
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_teacher(db):
    # Clear any existing teachers
    db.query(Teacher).delete()
    db.commit()
    
    teacher = Teacher(
        name="Test Teacher",
        email="test.teacher@example.com",
        faculty="Test Faculty",
        department="Test Department",
        working_days="Monday,Tuesday,Wednesday",
        working_hours="09:00-17:00"
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@pytest.fixture(scope="function")
def test_classroom(db):
    # Clear any existing classrooms
    db.query(Classroom).delete()
    db.commit()
    
    classroom = Classroom(
        name="Test Classroom",
        capacity=30,
        type="Lecture",
        faculty="Test Faculty",
        department="Test Department"
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom

@pytest.fixture(scope="function")
def test_course(db, test_teacher):
    # Clear any existing courses
    db.query(Course).delete()
    db.commit()
    
    course = Course(
        name="Test Course",
        code="TEST101",
        teacher_id=test_teacher.id,
        faculty="Test Faculty",
        department="Test Department",
        level="Bachelor",
        type="Core",
        category="Required",
        semester="Fall",
        ects=6,
        total_hours=3,
        is_active=True,
        student_count=25
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@pytest.fixture(scope="function")
def test_schedule(db, test_course, test_classroom):
    # Clear any existing schedules
    db.query(Schedule).delete()
    db.commit()
    
    schedule = Schedule(
        day="Monday",
        time_range="09:00-10:30",
        course_id=test_course.id,
        classroom_id=test_classroom.id
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule 