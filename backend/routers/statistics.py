from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Teacher, Course, Classroom, Schedule

router = APIRouter()

@router.get("/")
def get_statistics(db: Session = Depends(get_db)):
    """
    Get overall statistics of the system
    """
    # Count records
    teacher_count = db.query(Teacher).count()
    course_count = db.query(Course).count()
    classroom_count = db.query(Classroom).count()
    schedule_count = db.query(Schedule).count()
    
    # Active courses
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    
    # Calculate total student count across all courses
    total_students_result = db.query(Course.student_count).all()
    total_students = sum(count for (count,) in total_students_result)
    
    # Return statistics
    return {
        "teacherCount": teacher_count,
        "courseCount": course_count,
        "classroomCount": classroom_count,
        "scheduleCount": schedule_count,
        "activeCourses": active_courses,
        "totalStudents": total_students
    }

@router.get("/courses-by-faculty")
def get_courses_by_faculty(db: Session = Depends(get_db)):
    """
    Get course statistics grouped by faculty
    """
    faculties = {}
    courses = db.query(Course).options(
        joinedload(Course.departments)
    ).all()
    
    for course in courses:
        if course.faculty not in faculties:
            faculties[course.faculty] = {
                "courseCount": 0,
                "departments": {},
                "studentCount": 0
            }
        
        faculties[course.faculty]["courseCount"] += 1
        
        # Calculate total student count from all departments
        course_student_count = 0
        if course.departments:
            course_student_count = sum(dept.student_count for dept in course.departments)
        else:
            # Fallback for backward compatibility
            course_student_count = course.student_count
        
        faculties[course.faculty]["studentCount"] += course_student_count
        
        # Update department statistics
        for dept in course.departments:
            if dept.department not in faculties[course.faculty]["departments"]:
                faculties[course.faculty]["departments"][dept.department] = {
                    "courseCount": 0,
                    "studentCount": 0
                }
            
            faculties[course.faculty]["departments"][dept.department]["courseCount"] += 1
            faculties[course.faculty]["departments"][dept.department]["studentCount"] += dept.student_count
    
    return faculties
