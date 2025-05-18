from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.course import CourseCreate, CourseResponse
from services.courses_service import (
    get_all_courses, get_unscheduled_courses, get_course_by_id,
    create_course as create_course_service,
    update_course as update_course_service,
    delete_course as delete_course_service
)

router = APIRouter()

@router.get("")
def get_courses(db: Session = Depends(get_db)):
    try:
        courses = get_all_courses(db)
        return [CourseResponse(**{
            **c.__dict__,
            "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in c.sessions],
            "departments": [{"id": d.id, "department": d.department, "student_count": d.student_count} for d in c.departments],
            "teacher": {"id": c.teacher.id, "name": c.teacher.name} if c.teacher else None
        }).dict() for c in courses]
    except Exception as e:
        print(f"[ERROR] get_courses: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Dersler alınırken hata: {str(e)}")

@router.get("/unscheduled")
def get_unscheduled_courses_endpoint(db: Session = Depends(get_db)):
    courses = get_unscheduled_courses(db)
    return [{
        "id": c.id,
        "name": c.name,
        "code": c.code,
        "teacher_id": c.teacher_id,
        "faculty": c.faculty,
        "level": c.level,
        "type": c.type,
        "category": c.category,
        "semester": c.semester,
        "ects": c.ects,
        "total_hours": c.total_hours,
        "is_active": c.is_active,
        "departments": [{"id": d.id, "department": d.department, "student_count": d.student_count} for d in c.departments]
    } for c in courses]

@router.get("/{course_id}")
def get_course_endpoint(course_id: int, db: Session = Depends(get_db)):
    course = get_course_by_id(course_id, db)
    if not course:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return CourseResponse(**{
        **course.__dict__,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in course.sessions],
        "departments": [{"id": d.id, "department": d.department, "student_count": d.student_count} for d in course.departments],
        "teacher": {"id": course.teacher.id, "name": course.teacher.name} if course.teacher else None
    }).dict()

@router.post("", status_code=201)
def create_course_endpoint(course: CourseCreate, db: Session = Depends(get_db)):
    new_course = create_course_service(course, db)
    return CourseResponse(**{
        **new_course.__dict__,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in new_course.sessions],
        "departments": [{"id": d.id, "department": d.department, "student_count": d.student_count} for d in new_course.departments],
        "teacher": {"id": new_course.teacher.id, "name": new_course.teacher.name} if new_course.teacher else None
    }).dict()

@router.put("/{course_id}")
def update_course_endpoint(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    updated_course = update_course_service(course_id, course, db)
    return CourseResponse(**{
        **updated_course.__dict__,
        "sessions": [{"id": s.id, "type": s.type, "hours": s.hours} for s in updated_course.sessions],
        "departments": [{"id": d.id, "department": d.department, "student_count": d.student_count} for d in updated_course.departments],
        "teacher": {"id": updated_course.teacher.id, "name": updated_course.teacher.name} if updated_course.teacher else None
    }).dict()

@router.delete("/{course_id}")
def delete_course_endpoint(course_id: int, db: Session = Depends(get_db)):
    delete_course_service(course_id, db)
    return {"detail": "Course deleted successfully"} 