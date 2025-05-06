from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Classroom, Schedule
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ClassroomCreate(BaseModel):
    name: str
    capacity: int
    type: str
    faculty: str
    department: str

@router.get("/")
def get_classrooms(db: Session = Depends(get_db)):
    """
    Get all classrooms
    """
    classrooms = db.query(Classroom).all()
    return classrooms

@router.get("/{classroom_id}")
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    """
    Get a specific classroom by ID
    """
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom

@router.post("/")
def create_classroom(classroom: ClassroomCreate, db: Session = Depends(get_db)):
    """
    Create a new classroom
    """
    # Check if classroom with the same name already exists
    existing_classroom = db.query(Classroom).filter(Classroom.name == classroom.name).first()
    if existing_classroom:
        raise HTTPException(status_code=400, detail="Classroom with this name already exists")
    
    new_classroom = Classroom(
        name=classroom.name,
        capacity=classroom.capacity,
        type=classroom.type,
        faculty=classroom.faculty,
        department=classroom.department
    )
    
    db.add(new_classroom)
    db.commit()
    db.refresh(new_classroom)
    return new_classroom

@router.put("/{classroom_id}")
def update_classroom(classroom_id: int, classroom: ClassroomCreate, db: Session = Depends(get_db)):
    """
    Update an existing classroom
    """
    existing_classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not existing_classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if another classroom with the same name already exists
    name_conflict = db.query(Classroom).filter(
        Classroom.name == classroom.name, 
        Classroom.id != classroom_id
    ).first()
    
    if name_conflict:
        raise HTTPException(status_code=400, detail="Another classroom with this name already exists")
    
    existing_classroom.name = classroom.name
    existing_classroom.capacity = classroom.capacity
    existing_classroom.type = classroom.type
    existing_classroom.faculty = classroom.faculty
    existing_classroom.department = classroom.department
    
    db.commit()
    db.refresh(existing_classroom)
    return existing_classroom

@router.delete("/{classroom_id}")
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    """
    Delete a classroom
    """
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if classroom is used in any schedules
    schedule_exists = db.query(Schedule).filter(Schedule.classroom_id == classroom_id).first()
    if schedule_exists:
        raise HTTPException(status_code=400, detail="Classroom cannot be deleted because it is used in schedules")
    
    db.delete(classroom)
    db.commit()
    return {"message": "Classroom deleted successfully"}

