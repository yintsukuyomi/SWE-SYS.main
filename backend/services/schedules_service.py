from sqlalchemy.orm import Session, joinedload
from models import Schedule, Course, Classroom
from fastapi import HTTPException, status
from schemas.schedule import ScheduleCreate

def get_all_schedules(db: Session):
    return db.query(Schedule).options(
        joinedload(Schedule.course).joinedload(Course.teacher),
        joinedload(Schedule.classroom)
    ).all()

def get_schedule_by_id(schedule_id: int, db: Session):
    return db.query(Schedule).options(
        joinedload(Schedule.course).joinedload(Course.teacher),
        joinedload(Schedule.classroom)
    ).filter(Schedule.id == schedule_id).first()

def create_schedule(schedule: ScheduleCreate, db: Session):
    course = db.query(Course).filter(Course.id == schedule.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course not found")
    classroom = db.query(Classroom).filter(Classroom.id == schedule.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom not found")
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
    return new_schedule

def update_schedule(schedule_id: int, schedule: ScheduleCreate, db: Session):
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    course = db.query(Course).filter(Course.id == schedule.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course not found")
    classroom = db.query(Classroom).filter(Classroom.id == schedule.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom not found")
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
    return db_schedule

def delete_schedule(schedule_id: int, db: Session):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return True

def delete_schedules_by_day(day: str, db: Session):
    schedules = db.query(Schedule).filter(Schedule.day == day).all()
    for schedule in schedules:
        db.delete(schedule)
    db.commit()
    return True

def delete_schedules_by_days(days: list[str], db: Session):
    schedules = db.query(Schedule).filter(Schedule.day.in_(days)).all()
    for schedule in schedules:
        db.delete(schedule)
    db.commit()
    return True 