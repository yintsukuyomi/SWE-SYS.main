from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schedule import ScheduleCreate, ScheduleResponse
from services.schedules_service import (
    get_all_schedules, get_schedule_by_id,
    create_schedule as create_schedule_service,
    update_schedule as update_schedule_service,
    delete_schedule as delete_schedule_service,
    delete_schedules_by_day as delete_schedules_by_day_service,
    delete_schedules_by_days as delete_schedules_by_days_service
)
from pydantic import BaseModel
from typing import List

router = APIRouter()

class DaysDeleteRequest(BaseModel):
    days: List[str]

@router.get("")
def get_schedules(db: Session = Depends(get_db)):
    schedules = get_all_schedules(db)
    # Burada ScheduleResponse ile serialize edilebilir
    return [ScheduleResponse(**{
        "id": s.id,
        "day": s.day,
        "time_range": s.time_range,
        "course_id": s.course_id,
        "classroom_id": s.classroom_id
    }).dict() for s in schedules]

@router.get("/{schedule_id}")
def get_schedule_endpoint(schedule_id: int, db: Session = Depends(get_db)):
    schedule = get_schedule_by_id(schedule_id, db)
    if not schedule:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return ScheduleResponse(**{
        "id": schedule.id,
        "day": schedule.day,
        "time_range": schedule.time_range,
        "course_id": schedule.course_id,
        "classroom_id": schedule.classroom_id
    }).dict()

@router.post("", status_code=201)
def create_schedule_endpoint(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    new_schedule = create_schedule_service(schedule, db)
    return ScheduleResponse(**{
        "id": new_schedule.id,
        "day": new_schedule.day,
        "time_range": new_schedule.time_range,
        "course_id": new_schedule.course_id,
        "classroom_id": new_schedule.classroom_id
    }).dict()

@router.put("/{schedule_id}")
def update_schedule_endpoint(schedule_id: int, schedule: ScheduleCreate, db: Session = Depends(get_db)):
    updated_schedule = update_schedule_service(schedule_id, schedule, db)
    return ScheduleResponse(**{
        "id": updated_schedule.id,
        "day": updated_schedule.day,
        "time_range": updated_schedule.time_range,
        "course_id": updated_schedule.course_id,
        "classroom_id": updated_schedule.classroom_id
    }).dict()

@router.delete("/{schedule_id}")
def delete_schedule_endpoint(schedule_id: int, db: Session = Depends(get_db)):
    delete_schedule_service(schedule_id, db)
    return {"detail": "Schedule deleted successfully"}

@router.delete("/day/{day}")
def delete_schedules_by_day_endpoint(day: str, db: Session = Depends(get_db)):
    delete_schedules_by_day_service(day, db)
    return {"detail": f"All schedules for {day} deleted successfully"}

@router.delete("/days")
def delete_schedules_by_days_endpoint(request: DaysDeleteRequest, db: Session = Depends(get_db)):
    delete_schedules_by_days_service(request.days, db)
    return {"detail": f"All schedules for {', '.join(request.days)} deleted successfully"} 