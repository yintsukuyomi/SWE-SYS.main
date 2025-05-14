from sqlalchemy.orm import Session, joinedload
from models import Course, Teacher, Schedule, CourseSession, CourseDepartment
from fastapi import HTTPException, status
from schemas.course import CourseCreate

def get_all_courses(db: Session):
    courses = db.query(Course).options(
        joinedload(Course.teacher),
        joinedload(Course.sessions),
        joinedload(Course.departments)
    ).all()
    return courses

def get_unscheduled_courses(db: Session):
    courses = db.query(Course).options(
        joinedload(Course.departments)
    ).filter(~Course.schedules.any()).all()
    return courses

def get_course_by_id(course_id: int, db: Session):
    course = db.query(Course).options(
        joinedload(Course.teacher),
        joinedload(Course.sessions),
        joinedload(Course.departments)
    ).filter(Course.id == course_id).first()
    return course

def create_course(course: CourseCreate, db: Session):
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher not found")
    existing_course = db.query(Course).filter(Course.code == course.code).first()
    if existing_course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course with this code already exists")
    course_data = course.dict(exclude={'sessions', 'departments'})
    new_course = Course(**course_data)
    db.add(new_course)
    db.flush()
    for session in course.sessions:
        new_session = CourseSession(
            course_id=new_course.id,
            type=session.type,
            hours=session.hours
        )
        db.add(new_session)
    for dept in course.departments:
        new_dept = CourseDepartment(
            course_id=new_course.id,
            department=dept.department,
            student_count=dept.student_count
        )
        db.add(new_dept)
    db.commit()
    db.refresh(new_course)
    return new_course

def update_course(course_id: int, course: CourseCreate, db: Session):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher not found")
    existing_course = db.query(Course).filter(
        Course.code == course.code,
        Course.id != course_id
    ).first()
    if existing_course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course with this code already exists")
    course_data = course.dict(exclude={'sessions', 'departments'})
    for key, value in course_data.items():
        setattr(db_course, key, value)
    db.query(CourseSession).filter(CourseSession.course_id == course_id).delete()
    db.query(CourseDepartment).filter(CourseDepartment.course_id == course_id).delete()
    for session in course.sessions:
        new_session = CourseSession(
            course_id=course_id,
            type=session.type,
            hours=session.hours
        )
        db.add(new_session)
    for dept in course.departments:
        new_dept = CourseDepartment(
            course_id=course_id,
            department=dept.department,
            student_count=dept.student_count
        )
        db.add(new_dept)
    db.commit()
    db.refresh(db_course)
    return db_course

def delete_course(course_id: int, db: Session):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.schedules:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete course that is used in schedules")
    db.delete(course)
    db.commit()
    return True 