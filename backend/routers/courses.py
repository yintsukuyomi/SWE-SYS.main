from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
from models import Course, Teacher, Schedule
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CourseCreate(BaseModel):
    name: str
    code: str
    teacher_id: int
    faculty: str
    department: str
    level: str
    type: str
    category: Optional[str] = None
    semester: str
    ects: int
    total_hours: int
    is_active: bool = True
    student_count: int = 0  # Varsayılan değer 0

@router.get("/")
def get_courses(db: Session = Depends(get_db)):
    """
    Get all courses with their associated teachers
    """
    # Teacher ilişkisini eager loading ile yükle
    courses = db.query(Course).options(joinedload(Course.teacher)).all()
    return courses

@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    """
    Get a specific course by ID
    """
    course = db.query(Course).options(joinedload(Course.teacher)).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """
    Create a new course
    """
    # Teacher_id kontrolü
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail=f"Teacher with ID {course.teacher_id} does not exist")
    
    # Check if course code is unique
    existing_code = db.query(Course).filter(Course.code == course.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    new_course = Course(
        name=course.name,
        code=course.code,
        teacher_id=course.teacher_id,
        faculty=course.faculty,
        department=course.department,
        level=course.level,
        type=course.type,
        category=course.category,
        semester=course.semester,
        ects=course.ects,
        total_hours=course.total_hours,
        is_active=course.is_active,
        student_count=course.student_count  # Öğrenci sayısını ekliyoruz
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.put("/{course_id}")
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """
    Update an existing course
    """
    # Check if course exists
    existing_course = db.query(Course).filter(Course.id == course_id).first()
    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Teacher_id kontrolü
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail=f"Teacher with ID {course.teacher_id} does not exist")
    
    # Check if course code is unique (excluding this course)
    code_exists = db.query(Course).filter(
        Course.code == course.code, 
        Course.id != course_id
    ).first()
    if code_exists:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    # Update course fields
    existing_course.name = course.name
    existing_course.code = course.code
    existing_course.teacher_id = course.teacher_id
    existing_course.faculty = course.faculty
    existing_course.department = course.department
    existing_course.level = course.level
    existing_course.type = course.type
    existing_course.category = course.category
    existing_course.semester = course.semester
    existing_course.ects = course.ects
    existing_course.total_hours = course.total_hours
    existing_course.is_active = course.is_active
    existing_course.student_count = course.student_count  # Öğrenci sayısını güncelliyoruz
    
    db.commit()
    db.refresh(existing_course)
    return existing_course

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """
    Delete a course
    """
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if course is used in any schedules
    schedule_exists = db.query(Schedule).filter(Schedule.course_id == course_id).first()
    if schedule_exists:
        raise HTTPException(status_code=400, detail="Course cannot be deleted because it is used in schedules")
    
    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully"}

@router.get("/unscheduled")
def get_unscheduled_courses(db: Session = Depends(get_db)):
    """
    Get courses that are not scheduled yet
    """
    # Programlanmış kursların ID'lerini al
    scheduled_course_ids = db.query(Schedule.course_id).distinct().all()
    scheduled_ids = [id for (id,) in scheduled_course_ids]
    
    # Programlanmamış ve aktif olan kursları getir
    unscheduled_courses = db.query(Course).filter(
        Course.is_active == True,
        ~Course.id.in_(scheduled_ids) if scheduled_ids else True
    ).options(joinedload(Course.teacher)).all()
    
    return unscheduled_courses
