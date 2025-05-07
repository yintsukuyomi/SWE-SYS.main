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
    departments: list[str]  # Değişiklik: Tekil 'department' yerine çoklu 'departments'
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
    return db.query(Course).options(joinedload(Course.teacher)).all()

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
    
    # Her bölüm için ayrı Course kaydı oluştur
    new_courses = []
    for department in course.departments:
        new_course = Course(
            name=course.name,
            code=course.code,
            teacher_id=course.teacher_id,
            faculty=course.faculty,
            department=department,
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
        new_courses.append(new_course)
    db.commit()
    for nc in new_courses:
        db.refresh(nc)
    return new_courses if len(new_courses) > 1 else new_courses[0]

@router.put("/{course_id}")
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """
    Update an existing course
    """
    existing_course = db.query(Course).filter(Course.id == course_id).first()
    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail=f"Teacher with ID {course.teacher_id} does not exist")
    code_exists = db.query(Course).filter(
        Course.code == course.code, 
        Course.id != course_id
    ).first()
    if code_exists:
        raise HTTPException(status_code=400, detail="Course code already exists")
    # Sadece ilk department ile güncelle (çoklu department desteği için frontend'de ayrı course kaydı oluşturulmalı)
    for field in course.dict():
        if field == "departments":
            setattr(existing_course, "department", course.departments[0] if course.departments else "")
        else:
            setattr(existing_course, field, getattr(course, field))
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
