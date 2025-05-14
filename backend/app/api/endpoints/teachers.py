from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.teacher import TeacherCreate, TeacherResponse
from services.teachers_service import (
    get_all_teachers, get_teacher_by_id,
    create_teacher as create_teacher_service,
    update_teacher as update_teacher_service,
    delete_teacher as delete_teacher_service
)

router = APIRouter()

@router.get("")
def get_teachers(db: Session = Depends(get_db)):
    teachers = get_all_teachers(db)
    return [TeacherResponse(**t.__dict__).dict() for t in teachers]

@router.get("/{teacher_id}")
def get_teacher_endpoint(teacher_id: int, db: Session = Depends(get_db)):
    teacher = get_teacher_by_id(teacher_id, db)
    if not teacher:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return TeacherResponse(**teacher.__dict__).dict()

@router.post("", status_code=201)
def create_teacher_endpoint(teacher: TeacherCreate, db: Session = Depends(get_db)):
    new_teacher = create_teacher_service(teacher, db)
    return TeacherResponse(**new_teacher.__dict__).dict()

@router.put("/{teacher_id}")
def update_teacher_endpoint(teacher_id: int, teacher: TeacherCreate, db: Session = Depends(get_db)):
    updated_teacher = update_teacher_service(teacher_id, teacher, db)
    return TeacherResponse(**updated_teacher.__dict__).dict()

@router.delete("/{teacher_id}")
def delete_teacher_endpoint(teacher_id: int, db: Session = Depends(get_db)):
    delete_teacher_service(teacher_id, db)
    return {"detail": "Teacher deleted successfully"} 