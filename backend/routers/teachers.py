from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Teacher, Course
from pydantic import BaseModel
import logging

# Logging ayarları
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

class TeacherCreate(BaseModel):
    name: str
    email: str
    faculty: str
    department: str
    working_hours: str

@router.get("")
def get_teachers(db: Session = Depends(get_db)):
    """
    Get all teachers
    """
    teachers = db.query(Teacher).all()
    return [{"id": t.id, "name": t.name, "email": t.email, "faculty": t.faculty,
             "department": t.department, "working_hours": t.working_hours} for t in teachers]

@router.get("/{teacher_id}")
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """
    Get a specific teacher by ID
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Debug log
    logger.debug(f"Teacher data from database: {teacher.__dict__}")
    
    response_data = {
        "id": teacher.id,
        "name": teacher.name,
        "email": teacher.email,
        "faculty": teacher.faculty,
        "department": teacher.department,
        "working_hours": teacher.working_hours
    }
    
    # Debug log
    logger.debug(f"Response data: {response_data}")
    
    return response_data

@router.post("", status_code=status.HTTP_201_CREATED)
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    """
    Create a new teacher
    """
    # Check if teacher with same email exists
    existing_teacher = db.query(Teacher).filter(Teacher.email == teacher.email).first()
    if existing_teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher with this email already exists")
    
    # Debug log
    logger.debug(f"Creating teacher with data: {teacher.dict()}")
    
    new_teacher = Teacher(**teacher.dict())
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    # Debug log
    logger.debug(f"Created teacher data: {new_teacher.__dict__}")
    
    return {"id": new_teacher.id, "name": new_teacher.name, "email": new_teacher.email, "faculty": new_teacher.faculty,
            "department": new_teacher.department, "working_hours": new_teacher.working_hours}

@router.put("/{teacher_id}")
def update_teacher(teacher_id: int, teacher: TeacherCreate, db: Session = Depends(get_db)):
    """
    Update a teacher
    """
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Check if another teacher with same email exists
    existing_teacher = db.query(Teacher).filter(
        Teacher.email == teacher.email,
        Teacher.id != teacher_id
    ).first()
    if existing_teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher with this email already exists")
    
    # Debug log
    logger.debug(f"Updating teacher with data: {teacher.dict()}")
    
    for key, value in teacher.dict().items():
        setattr(db_teacher, key, value)
    
    db.commit()
    db.refresh(db_teacher)
    
    # Debug log
    logger.debug(f"Updated teacher data: {db_teacher.__dict__}")
    
    return {"id": db_teacher.id, "name": db_teacher.name, "email": db_teacher.email, "faculty": db_teacher.faculty,
            "department": db_teacher.department, "working_hours": db_teacher.working_hours}

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """
    Delete a teacher
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Check if teacher has any assigned courses
    if teacher.courses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete teacher that has assigned courses")
    
    db.delete(teacher)
    db.commit()
    return {"detail": "Teacher deleted successfully"}
