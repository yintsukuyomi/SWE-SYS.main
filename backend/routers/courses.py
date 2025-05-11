from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Course, Teacher, Schedule
from pydantic import BaseModel
from enum import Enum

router = APIRouter()

class CourseType(str, Enum):
    teorik = "teorik"
    lab = "lab"

class CourseCategory(str, Enum):
    zorunlu = "zorunlu"
    secmeli = "secmeli"

class CourseCreate(BaseModel):
    name: str
    code: str
    teacher_id: int
    faculty: str
    department: str
    level: str
    type: CourseType
    category: CourseCategory
    semester: str
    ects: int
    total_hours: int
    is_active: bool
    student_count: int

@router.get("")
def get_courses(db: Session = Depends(get_db)):
    """
    Get all courses with related data
    """
    courses = db.query(Course).options(
        joinedload(Course.teacher)
    ).all()
    
    return [{
        "id": c.id,
        "name": c.name,
        "code": c.code,
        "teacher_id": c.teacher_id,
        "faculty": c.faculty,
        "department": c.department,
        "level": c.level,
        "type": c.type,
        "category": c.category,
        "semester": c.semester,
        "ects": c.ects,
        "total_hours": c.total_hours,
        "is_active": c.is_active,
        "student_count": c.student_count,
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
    Get a specific course by ID, including teacher info
    """
    course = db.query(Course).options(joinedload(Course.teacher)).filter(Course.id == course_id).first()
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
        "type": course.type,
        "category": course.category,
        "semester": course.semester,
        "ects": course.ects,
        "total_hours": course.total_hours,
        "is_active": course.is_active,
        "student_count": course.student_count,
        "teacher": {
            "id": course.teacher.id,
            "name": course.teacher.name
        } if course.teacher else None
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """
    Create a new course
    """
    # Check if teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher not found")
    
    # Check if course with same code exists
    existing_course = db.query(Course).filter(Course.code == course.code).first()
    if existing_course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course with this code already exists")
    
    new_course = Course(**course.dict())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return {"id": new_course.id, "name": new_course.name, "code": new_course.code, "teacher_id": new_course.teacher_id,
            "faculty": new_course.faculty, "department": new_course.department, "level": new_course.level,
            "type": new_course.type, "category": new_course.category, "semester": new_course.semester,
            "ects": new_course.ects, "total_hours": new_course.total_hours, "is_active": new_course.is_active,
            "student_count": new_course.student_count}

@router.put("/{course_id}")
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """
    Update a course
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
    
    for key, value in course.dict().items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return {"id": db_course.id, "name": db_course.name, "code": db_course.code, "teacher_id": db_course.teacher_id,
            "faculty": db_course.faculty, "department": db_course.department, "level": db_course.level,
            "type": db_course.type, "category": db_course.category, "semester": db_course.semester,
            "ects": db_course.ects, "total_hours": db_course.total_hours, "is_active": db_course.is_active,
            "student_count": db_course.student_count}

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """
    Delete a course
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
