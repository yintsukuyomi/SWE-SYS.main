from fastapi import APIRouter, Depends
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

@router.get("/")
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()

@router.post("/")
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    new_teacher = Teacher(
        name=teacher.name,
        email=teacher.email,
        faculty=teacher.faculty,
        department=teacher.department,
        working_days=teacher.working_days,
        working_hours=teacher.working_hours,
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if teacher:
        db.delete(teacher)
        db.commit()
        return {"message": "Teacher deleted successfully"}
    return {"error": "Teacher not found"}

@router.put("/{teacher_id}")
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
