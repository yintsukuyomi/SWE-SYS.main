from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Teacher
from pydantic import BaseModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TeacherCreate(BaseModel):
    name: str
    email: str
    faculty: str
    department: str
    working_days: str
    working_hours: str

@router.get("")
def get_teachers(db: Session = Depends(get_db)):
    """
    Get all teachers
    """
    return db.query(Teacher).all()

@router.post("")
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    """
    Create a new teacher
    """
    db_teacher = Teacher(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.delete("/{teacher_id}")  # Sadece "/{teacher_id}" olarak değiştirdik
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if teacher:
        db.delete(teacher)
        db.commit()
        return {"message": "Teacher deleted successfully"}
    return {"error": "Teacher not found"}

@router.put("/{teacher_id}")  # Sadece "/{teacher_id}" olarak değiştirdik
def update_teacher(teacher_id: int, teacher: TeacherCreate, db: Session = Depends(get_db)):
    existing_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not existing_teacher:
        return {"error": "Teacher not found"}
    
    existing_teacher.name = teacher.name
    existing_teacher.email = teacher.email
    existing_teacher.faculty = teacher.faculty
    existing_teacher.department = teacher.department
    existing_teacher.working_days = teacher.working_days
    existing_teacher.working_hours = teacher.working_hours
    
    db.commit()
    db.refresh(existing_teacher)
    return existing_teacher

@router.get("/{teacher_id}")  # Sadece "/{teacher_id}" olarak değiştirdik
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """
    Get a specific teacher by ID
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher
