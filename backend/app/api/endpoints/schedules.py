from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
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
from models import Schedule

router = APIRouter()

class DaysDeleteRequest(BaseModel):
    days: List[str]

@router.get("")
def get_schedules(db: Session = Depends(get_db)):
    schedules = db.query(Schedule).options(
        joinedload(Schedule.course),
        joinedload(Schedule.classroom)
    ).all()
    result = []
    for s in schedules:
        course = s.course
        classroom = s.classroom
        student_count = 0
        if course and hasattr(course, 'departments') and course.departments:
            try:
                student_count = sum(getattr(dept, 'student_count', 0) for dept in course.departments)
            except Exception:
                student_count = getattr(course, 'student_count', 0)
        else:
            student_count = getattr(course, 'student_count', 0)
        result.append({
        "id": s.id,
        "day": s.day,
        "time_range": s.time_range,
            "course": {
                "id": course.id if course else None,
                "name": course.name if course else None,
                "code": course.code if course else None,
                "teacher_id": course.teacher_id if course else None,
                "teacher": {
                    "id": course.teacher.id,
                    "name": course.teacher.name,
                    "email": course.teacher.email,
                    "faculty": course.teacher.faculty,
                    "department": course.teacher.department
                } if course and course.teacher else None,
                "total_hours": getattr(course, 'total_hours', None),
                "student_count": student_count
            } if course else None,
            "classroom": {
                "id": classroom.id if classroom else None,
                "name": classroom.name if classroom else None,
                "type": classroom.type if classroom else None,
                "capacity": classroom.capacity if classroom else None
            } if classroom else None
        })
    return result

@router.get("/{schedule_id}")
def get_schedule_endpoint(schedule_id: int, db: Session = Depends(get_db)):
    s = db.query(Schedule).options(
        joinedload(Schedule.course),
        joinedload(Schedule.classroom)
    ).filter(Schedule.id == schedule_id).first()
    if not s:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    course = s.course
    classroom = s.classroom
    return {
        "id": s.id,
        "day": s.day,
        "time_range": s.time_range,
        "course": {
            "id": course.id if course else None,
            "name": course.name if course else None,
            "code": course.code if course else None,
            "teacher_id": course.teacher_id if course else None,
            "teacher": {
                "id": course.teacher.id,
                "name": course.teacher.name,
                "email": course.teacher.email,
                "faculty": course.teacher.faculty,
                "department": course.teacher.department
            } if course and course.teacher else None,
            "total_hours": getattr(course, 'total_hours', None),
            "student_count": getattr(course, 'student_count', 0)
        } if course else None,
        "classroom": {
            "id": classroom.id if classroom else None,
            "name": classroom.name if classroom else None,
            "type": classroom.type if classroom else None,
            "capacity": classroom.capacity if classroom else None
        } if classroom else None
    }

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

@router.post("/days/delete")
def delete_schedules_by_days_endpoint(request: DaysDeleteRequest, db: Session = Depends(get_db)):
    delete_schedules_by_days_service(request.days, db)
    return {"detail": f"All schedules for {', '.join(request.days)} deleted successfully"} 