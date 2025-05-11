from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum("admin", "teacher", name="user_roles"), index=True)

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    faculty = Column(String)
    department = Column(String)
    working_days = Column(String)
    working_hours = Column(String)
    courses = relationship("Course", back_populates="teacher")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String, unique=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    faculty = Column(String)
    department = Column(String)
    level = Column(String)
    type = Column(String, default="Core")  # 'Core', 'Lab', 'Elective' vs.
    category = Column(String)  # 'zorunlu' or 'secmeli'
    semester = Column(String)
    ects = Column(Integer)
    total_hours = Column(Integer, default=2)  # Dersin toplam saat süresi
    is_active = Column(Boolean, default=True)
    student_count = Column(Integer, default=0)  # Dersi alan öğrenci sayısı
    teacher = relationship("Teacher", back_populates="courses")
    schedules = relationship("Schedule", back_populates="course")
    sessions = relationship("CourseSession", back_populates="course", cascade="all, delete-orphan")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    capacity = Column(Integer)
    type = Column(String)
    faculty = Column(String)
    department = Column(String)
    schedules = relationship("Schedule", back_populates="classroom")

class Schedule(Base):
    __tablename__ = "schedule"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String)
    time_range = Column(String)
    course_id = Column(Integer, ForeignKey("courses.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    course = relationship("Course", back_populates="schedules")
    classroom = relationship("Classroom", back_populates="schedules")

class CourseSession(Base):
    __tablename__ = "course_sessions"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    type = Column(String)  # 'teorik' or 'lab'
    hours = Column(Integer)  # Duration of this session in hours
    course = relationship("Course", back_populates="sessions")
