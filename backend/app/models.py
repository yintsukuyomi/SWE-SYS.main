from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    faculty = Column(String, index=True)
    department = Column(String, index=True)
    working_hours = Column(String)  # JSON formatında çalışma saatleri

    courses = relationship("Course", back_populates="teacher")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    faculty = Column(String, index=True)
    department = Column(String, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    student_count = Column(Integer, default=0)

    teacher = relationship("Teacher", back_populates="courses")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    capacity = Column(Integer)
    type = Column(String)
    faculty = Column(String)
    department = Column(String)
    schedules = relationship("Schedule", back_populates="classroom")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    day = Column(String)
    start_time = Column(String)
    end_time = Column(String)

    course = relationship("Course", back_populates="schedules")
    classroom = relationship("Classroom", back_populates="schedules") 