from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Course
from pydantic import BaseModel

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
    category: str
    semester: str
    ects: int
    total_hours: int
    is_active: bool = True

class CourseUpdate(BaseModel):
    name: str = None
    code: str = None
    teacher_id: int = None
    faculty: str = None
    department: str = None
    level: str = None
    type: str = None
    category: str = None
    semester: str = None
    ects: int = None
    total_hours: int = None
    is_active: bool = None

@router.get("/")
def get_courses(
    is_active: bool = None,
    teacher_id: int = None,
    faculty: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)
    if teacher_id is not None:
        query = query.filter(Course.teacher_id == teacher_id)
    if faculty is not None:
        query = query.filter(Course.faculty == faculty)
    return query.all()

@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    # Aynı code değerine sahip bir dersin var olup olmadığını kontrol et
    existing_course = db.query(Course).filter(Course.code == course.code).first()
    if existing_course:
        raise HTTPException(status_code=400, detail="A course with this code already exists")
    
    # Öğretmenin var olup olmadığını kontrol et
    teacher_exists = db.query(Course).filter(Course.teacher_id == course.teacher_id).first()
    if not teacher_exists:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
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
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully"}

@router.put("/{course_id}")
def update_course(course_id: int, course: CourseUpdate, db: Session = Depends(get_db)):
    existing_course = db.query(Course).filter(Course.id == course_id).first()
    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Güncellenen alanları kontrol et ve uygula
    for key, value in course.dict(exclude_unset=True).items():
        setattr(existing_course, key, value)
    
    db.commit()
    db.refresh(existing_course)
    return existing_course
