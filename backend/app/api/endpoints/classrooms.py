from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Classroom
from pydantic import BaseModel, Field

router = APIRouter()

class ClassroomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(..., gt=0)
    type: str = Field(..., min_length=1, max_length=50)
    faculty: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomResponse(ClassroomBase):
    id: int
    class Config:
        from_attributes = True

@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(db: Session = Depends(get_db)):
    return db.query(Classroom).all()

@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    try:
        classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
        if not classroom:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        return classroom
    except Exception as e:
        print(f"[ERROR] get_classroom: {e}")
        raise HTTPException(status_code=500, detail=f"Derslik alınırken hata: {str(e)}")

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(classroom: ClassroomCreate, db: Session = Depends(get_db)):
    existing_classroom = db.query(Classroom).filter(Classroom.name == classroom.name).first()
    if existing_classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom with this name already exists")
    new_classroom = Classroom(**classroom.model_dump())
    db.add(new_classroom)
    db.commit()
    db.refresh(new_classroom)
    return new_classroom

@router.put("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(classroom_id: int, classroom: ClassroomCreate, db: Session = Depends(get_db)):
    db_classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not db_classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    existing_classroom = db.query(Classroom).filter(
        Classroom.name == classroom.name,
        Classroom.id != classroom_id
    ).first()
    if existing_classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom with this name already exists")
    for key, value in classroom.model_dump().items():
        setattr(db_classroom, key, value)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@router.delete("/{classroom_id}", status_code=status.HTTP_200_OK)
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    if classroom.schedules:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete classroom that is used in schedules")
    db.delete(classroom)
    db.commit()
    return {"detail": "Classroom deleted successfully"} 