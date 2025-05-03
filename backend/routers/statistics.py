from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_statistics(db: Session = Depends(get_db)):
    """
    Get statistics about the system data - counts of teachers, courses, classrooms, and schedules
    """
    try:
        teachers_count = db.query(models.Teacher).count()
        courses_count = db.query(models.Course).count()
        classrooms_count = db.query(models.Classroom).count()
        schedules_count = db.query(models.Schedule).count()
        
        return {
            "teacherCount": teachers_count,
            "courseCount": courses_count,
            "classroomCount": classrooms_count,
            "scheduleCount": schedules_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
