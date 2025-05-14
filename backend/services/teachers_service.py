from sqlalchemy.orm import Session
from models import Teacher
from fastapi import HTTPException, status
from schemas.teacher import TeacherCreate

def get_all_teachers(db: Session):
    return db.query(Teacher).all()

def get_teacher_by_id(teacher_id: int, db: Session):
    return db.query(Teacher).filter(Teacher.id == teacher_id).first()

def create_teacher(teacher: TeacherCreate, db: Session):
    existing_teacher = db.query(Teacher).filter(Teacher.email == teacher.email).first()
    if existing_teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher with this email already exists")
    new_teacher = Teacher(**teacher.dict())
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher

def update_teacher(teacher_id: int, teacher: TeacherCreate, db: Session):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    existing_teacher = db.query(Teacher).filter(
        Teacher.email == teacher.email,
        Teacher.id != teacher_id
    ).first()
    if existing_teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher with this email already exists")
    for key, value in teacher.dict().items():
        setattr(db_teacher, key, value)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

def delete_teacher(teacher_id: int, db: Session):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    if teacher.courses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete teacher that has assigned courses")
    db.delete(teacher)
    db.commit()
    return True 