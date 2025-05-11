from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Schedule, Course, Classroom
from pydantic import BaseModel

router = APIRouter()

class ScheduleCreate(BaseModel):
    day: str
    time_range: str
    course_id: int
    classroom_id: int

@router.get("")
def get_schedules(db: Session = Depends(get_db)):
    """
    Get all schedules with related data
    """
    schedules = db.query(Schedule).options(
        joinedload(Schedule.course).joinedload(Course.teacher),
        joinedload(Schedule.classroom)
    ).all()
    
    return [{
        "id": s.id,
        "day": s.day,
        "time_range": s.time_range,
        "course_id": s.course_id,
        "classroom_id": s.classroom_id,
        "course": {
            "id": s.course.id,
            "name": s.course.name,
            "code": s.course.code,
            "teacher_id": s.course.teacher_id,
            "teacher": {
                "id": s.course.teacher.id,
                "name": s.course.teacher.name
            } if s.course.teacher else None,
            "student_count": s.course.student_count
        } if s.course else None,
        "classroom": {
            "id": s.classroom.id,
            "name": s.classroom.name,
            "capacity": s.classroom.capacity
        } if s.classroom else None
    } for s in schedules]

@router.get("/{schedule_id}")
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """
    Get a specific schedule by ID, including course and classroom info
    """
    schedule = db.query(Schedule).options(
        joinedload(Schedule.course).joinedload(Course.teacher),
        joinedload(Schedule.classroom)
    ).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return {
        "id": schedule.id,
        "day": schedule.day,
        "time_range": schedule.time_range,
        "course_id": schedule.course_id,
        "classroom_id": schedule.classroom_id,
        "course": {
            "id": schedule.course.id,
            "name": schedule.course.name,
            "code": schedule.course.code,
            "teacher_id": schedule.course.teacher_id,
            "teacher": {
                "id": schedule.course.teacher.id,
                "name": schedule.course.teacher.name
            } if schedule.course.teacher else None,
            "student_count": schedule.course.student_count
        } if schedule.course else None,
        "classroom": {
            "id": schedule.classroom.id,
            "name": schedule.classroom.name,
            "capacity": schedule.classroom.capacity
        } if schedule.classroom else None
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    """
    Create a new schedule
    """
    # Check if course exists
    course = db.query(Course).filter(Course.id == schedule.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course not found")
    
    # Check if classroom exists
    classroom = db.query(Classroom).filter(Classroom.id == schedule.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom not found")
    
    # Check for conflicts
    existing_schedule = db.query(Schedule).filter(
        Schedule.day == schedule.day,
        Schedule.time_range == schedule.time_range,
        (Schedule.course_id == schedule.course_id) | (Schedule.classroom_id == schedule.classroom_id)
    ).first()
    
    if existing_schedule:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Schedule conflict detected")
    
    new_schedule = Schedule(**schedule.dict())
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return {"id": new_schedule.id, "day": new_schedule.day, "time_range": new_schedule.time_range,
            "course_id": new_schedule.course_id, "classroom_id": new_schedule.classroom_id}

@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, schedule: ScheduleCreate, db: Session = Depends(get_db)):
    """
    Update a schedule
    """
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == schedule.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course not found")
    
    # Check if classroom exists
    classroom = db.query(Classroom).filter(Classroom.id == schedule.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom not found")
    
    # Check for conflicts
    existing_schedule = db.query(Schedule).filter(
        Schedule.day == schedule.day,
        Schedule.time_range == schedule.time_range,
        (Schedule.course_id == schedule.course_id) | (Schedule.classroom_id == schedule.classroom_id),
        Schedule.id != schedule_id
    ).first()
    
    if existing_schedule:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Schedule conflict detected")
    
    for key, value in schedule.dict().items():
        setattr(db_schedule, key, value)
    
    db.commit()
    db.refresh(db_schedule)
    return {"id": db_schedule.id, "day": db_schedule.day, "time_range": db_schedule.time_range,
            "course_id": db_schedule.course_id, "classroom_id": db_schedule.classroom_id}

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """
    Delete a schedule
    """
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    return {"detail": "Schedule deleted successfully"}

@router.delete("/day/{day}")
def delete_schedules_by_day(day: str, db: Session = Depends(get_db)):
    """
    Delete all schedules for a specific day
    """
    schedules = db.query(Schedule).filter(Schedule.day == day).all()
    for schedule in schedules:
        db.delete(schedule)
    db.commit()
    return {"detail": f"All schedules for {day} deleted successfully"}

@router.delete("/days")
def delete_schedules_by_days(days: list[str], db: Session = Depends(get_db)):
    """
    Delete all schedules for multiple days
    """
    schedules = db.query(Schedule).filter(Schedule.day.in_(days)).all()
    for schedule in schedules:
        db.delete(schedule)
    db.commit()
    return {"detail": f"All schedules for {', '.join(days)} deleted successfully"}
