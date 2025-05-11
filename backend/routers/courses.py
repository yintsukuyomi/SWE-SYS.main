from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Course, Teacher, Schedule, CourseSession
from pydantic import BaseModel
from enum import Enum
from typing import List

router = APIRouter()

class CourseType(str, Enum):
    teorik = "teorik"
    lab = "lab"

class CourseCategory(str, Enum):
    zorunlu = "zorunlu"
    secmeli = "secmeli"

class CourseSessionCreate(BaseModel):
    type: CourseType
    hours: int

class CourseCreate(BaseModel):
    name: str
    code: str
    teacher_id: int
    faculty: str
    department: str
    level: str
    category: CourseCategory
    semester: str
    ects: int
    is_active: bool
    student_count: int
    sessions: List[CourseSessionCreate]

class CourseSessionResponse(BaseModel):
    id: int
    type: str
    hours: int

class CourseResponse(BaseModel):
    id: int
    name: str
    code: str
    teacher_id: int
    faculty: str
    department: str
    level: str
    category: str
    semester: str
    ects: int
    is_active: bool
    student_count: int
    sessions: List[CourseSessionResponse]
    teacher: dict = None

@router.get("")
def get_courses(db: Session = Depends(get_db)):
    """
    Get all courses with related data
    """
    courses = db.query(Course).options(
        joinedload(Course.teacher),
        joinedload(Course.sessions)
    ).all()
    
    return [{
        "id": c.id,
        "name": c.name,
        "code": c.code,
        "teacher_id": c.teacher_id,
        "faculty": c.faculty,
        "department": c.department,
        "level": c.level,
        "category": c.category,
        "semester": c.semester,
        "ects": c.ects,
        "is_active": c.is_active,
        "student_count": c.student_count,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in c.sessions],
        "teacher": {
            "id": c.teacher.id,
            "name": c.teacher.name
        } if c.teacher else None
    } for c in courses]

@router.get("/unscheduled")
def get_unscheduled_courses(db: Session = Depends(get_db)):
    """
    Get all courses that are not scheduled
    """
    courses = db.query(Course).filter(~Course.schedules.any()).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "teacher_id": c.teacher_id,
             "faculty": c.faculty, "department": c.department, "level": c.level,
             "type": c.type, "category": c.category, "semester": c.semester,
             "ects": c.ects, "total_hours": c.total_hours, "is_active": c.is_active,
             "student_count": c.student_count} for c in courses]

@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    """
    Get a specific course by ID, including teacher info and sessions
    """
    course = db.query(Course).options(
        joinedload(Course.teacher),
        joinedload(Course.sessions)
    ).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    return {
        "id": course.id,
        "name": course.name,
        "code": course.code,
        "teacher_id": course.teacher_id,
        "faculty": course.faculty,
        "department": course.department,
        "level": course.level,
        "category": course.category,
        "semester": course.semester,
        "ects": course.ects,
        "is_active": course.is_active,
        "student_count": course.student_count,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in course.sessions],
        "teacher": {
            "id": course.teacher.id,
            "name": course.teacher.name
        } if course.teacher else None
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """
    Create a new course with sessions
    """
    # Check if teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher not found")
    
    # Check if course with same code exists
    existing_course = db.query(Course).filter(Course.code == course.code).first()
    if existing_course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course with this code already exists")
    
    # Create course without sessions first
    course_data = course.dict(exclude={'sessions'})
    new_course = Course(**course_data)
    db.add(new_course)
    db.flush()  # Get the ID without committing
    
    # Add sessions
    for session in course.sessions:
        new_session = CourseSession(
            course_id=new_course.id,
            type=session.type,
            hours=session.hours
        )
        db.add(new_session)
    
    db.commit()
    db.refresh(new_course)
    
    return {
        "id": new_course.id,
        "name": new_course.name,
        "code": new_course.code,
        "teacher_id": new_course.teacher_id,
        "faculty": new_course.faculty,
        "department": new_course.department,
        "level": new_course.level,
        "category": new_course.category,
        "semester": new_course.semester,
        "ects": new_course.ects,
        "is_active": new_course.is_active,
        "student_count": new_course.student_count,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in new_course.sessions]
    }

@router.put("/{course_id}")
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """
    Update a course and its sessions
    """
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Check if teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher not found")
    
    # Check if another course with same code exists
    existing_course = db.query(Course).filter(
        Course.code == course.code,
        Course.id != course_id
    ).first()
    if existing_course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course with this code already exists")
    
    # Update course fields
    course_data = course.dict(exclude={'sessions'})
    for key, value in course_data.items():
        setattr(db_course, key, value)
    
    # Delete existing sessions
    db.query(CourseSession).filter(CourseSession.course_id == course_id).delete()
    
    # Add new sessions
    for session in course.sessions:
        new_session = CourseSession(
            course_id=course_id,
            type=session.type,
            hours=session.hours
        )
        db.add(new_session)
    
    db.commit()
    db.refresh(db_course)
    
    return {
        "id": db_course.id,
        "name": db_course.name,
        "code": db_course.code,
        "teacher_id": db_course.teacher_id,
        "faculty": db_course.faculty,
        "department": db_course.department,
        "level": db_course.level,
        "category": db_course.category,
        "semester": db_course.semester,
        "ects": db_course.ects,
        "is_active": db_course.is_active,
        "student_count": db_course.student_count,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in db_course.sessions]
    }

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """
    Delete a course and its sessions
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Check if course is used in any schedules
    if course.schedules:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete course that is used in schedules")
    
    db.delete(course)
    db.commit()
    return {"detail": "Course deleted successfully"}
