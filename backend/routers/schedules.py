from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
from models import Schedule, Course, Classroom
from pydantic import BaseModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ScheduleCreate(BaseModel):
    day: str
    time_range: str
    course_id: int
    classroom_id: int

@router.get("")
def get_schedules(db: Session = Depends(get_db)):
    """
    Get all schedules with course and classroom information
    """
    schedules = db.query(Schedule).options(
        joinedload(Schedule.course),
        joinedload(Schedule.classroom)
    ).all()
    return schedules

@router.post("")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    new_schedule = Schedule(
        day=schedule.day,
        time_range=schedule.time_range,
        course_id=schedule.course_id,
        classroom_id=schedule.classroom_id,
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if schedule:
        db.delete(schedule)
        db.commit()
        return {"message": "Schedule deleted successfully"}
    return {"error": "Schedule not found"}

@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, schedule: ScheduleCreate, db: Session = Depends(get_db)):
    existing_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not existing_schedule:
        return {"error": "Schedule not found"}
    # Use setattr to update all fields
    for field in schedule.dict():
        setattr(existing_schedule, field, getattr(schedule, field))
    db.commit()
    db.refresh(existing_schedule)
    return existing_schedule

@router.delete("/day/{day}")
def delete_schedules_by_day(day: str, db: Session = Depends(get_db)):
    """
    Delete all schedules for a specific day
    """
    schedules = db.query(Schedule).filter(Schedule.day == day).all()
    if not schedules:
        raise HTTPException(status_code=404, detail=f"No schedules found for {day}")
    
    count = 0
    for schedule in schedules:
        db.delete(schedule)
        count += 1
    
    db.commit()
    return {"message": f"Successfully deleted {count} schedules for {day}"}
