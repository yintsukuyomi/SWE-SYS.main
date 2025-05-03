from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
from models import Course, Teacher, Classroom, Schedule
from datetime import datetime, time
from typing import List, Dict, Tuple, Any
import random

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Time block definition
TIME_BLOCKS = [
    {"start": "08:00", "end": "09:30"},
    {"start": "09:30", "end": "11:00"},
    {"start": "11:00", "end": "12:30"},
    {"start": "13:00", "end": "14:30"},
    {"start": "14:30", "end": "16:00"},
    {"start": "16:00", "end": "17:30"},
    {"start": "17:30", "end": "19:00"}
]

# Days of the week
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]

def parse_time(time_str):
    """Convert time string to datetime.time object"""
    return datetime.strptime(time_str, "%H:%M").time()

def is_time_in_range(time_to_check, start_time, end_time):
    """Check if a time is within a time range"""
    return start_time <= time_to_check <= end_time

def get_teacher_availability(teacher):
    """Get available time blocks for a teacher based on working days and hours"""
    working_days = teacher.working_days.lower().split(',')
    
    if not teacher.working_hours or '-' not in teacher.working_hours:
        return []
        
    work_hours = teacher.working_hours.split('-')
    if len(work_hours) != 2:
        return []
        
    try:
        start_time = parse_time(work_hours[0])
        end_time = parse_time(work_hours[1])
    except ValueError:
        return []
    
    availability = []
    for day in working_days:
        day = day.strip()
        if day in DAYS:
            for block in TIME_BLOCKS:
                block_start = parse_time(block["start"])
                block_end = parse_time(block["end"])
                
                # Check if the time block is within teacher's working hours
                if start_time <= block_start and block_end <= end_time:
                    availability.append((day, block["start"], block["end"]))
    
    return availability

def get_suitable_classrooms(course_type, available_classrooms, student_count):
    """Get classrooms suitable for the course type and with sufficient capacity"""
    suitable_rooms = []
    
    # Map course types to classroom types
    type_mapping = {
        "Lab": ["Laboratory", "Computer Lab"],
        "Core": ["Lecture Hall", "Classroom", "Conference Room"],
        "Elective": ["Lecture Hall", "Classroom", "Seminar Room"]
    }
    
    matching_types = type_mapping.get(course_type, ["Lecture Hall", "Classroom"])
    
    for classroom in available_classrooms:
        # İki koşulu kontrol ediyoruz: sınıf türü uyumlu mu ve kapasite yeterli mi
        if classroom.type in matching_types and classroom.capacity >= student_count:
            suitable_rooms.append(classroom)
    
    return suitable_rooms

def is_conflict(schedule_entries, day, start_time, end_time, teacher_id, classroom_id=None, department=None, level=None):
    """Check for conflicts in the schedule"""
    for entry in schedule_entries:
        if entry["day"] == day:
            entry_start = parse_time(entry["start_time"])
            entry_end = parse_time(entry["end_time"])
            
            # Check time overlap
            time_overlap = (
                (parse_time(start_time) <= entry_start <= parse_time(end_time)) or
                (parse_time(start_time) <= entry_end <= parse_time(end_time)) or
                (entry_start <= parse_time(start_time) and entry_end >= parse_time(end_time))
            )
            
            if time_overlap:
                # Teacher conflict
                if entry["teacher_id"] == teacher_id:
                    return True
                
                # Classroom conflict
                if classroom_id and entry["classroom_id"] == classroom_id:
                    return True
                
                # Department and level conflict (same department, same level classes shouldn't overlap)
                if department and level and entry["department"] == department and entry["level"] == level:
                    return True
    
    return False

@router.post("/generate")
async def generate_schedule(db: Session = Depends(get_db)):
    """Generate a complete class schedule"""
    try:
        # 1. Preprocessing
        # Get active courses
        active_courses = db.query(Course).filter(Course.is_active == True).options(
            joinedload(Course.teacher)
        ).all()
        
        if not active_courses:
            return {"message": "No active courses found to schedule"}
        
        # Get all teachers
        teachers = {teacher.id: teacher for teacher in db.query(Teacher).all()}
        
        # Get all classrooms
        classrooms = db.query(Classroom).all()
        
        if not classrooms:
            return {"message": "No classrooms available for scheduling"}
        
        # Clear previous schedule
        db.query(Schedule).delete()
        db.commit()
        
        # 2. Prioritize courses
        prioritized_courses = sorted(
            active_courses, 
            key=lambda c: (
                0 if c.type == "Core" else 1,  # Core courses first
                -c.ects,  # Higher ECTS credits first
                -c.total_hours,  # More hours first
                -c.student_count  # Courses with more students first to ensure they get suitable classrooms
            )
        )
        
        # 3. Schedule planning
        schedule_entries = []
        unscheduled_courses = []
        
        for course in prioritized_courses:
            teacher = teachers.get(course.teacher_id)
            if not teacher:
                unscheduled_courses.append((course, "No teacher assigned"))
                continue
            
            teacher_availability = get_teacher_availability(teacher)
            if not teacher_availability:
                unscheduled_courses.append((course, "Teacher has no available time slots"))
                continue
            
            # Öğrenci sayısına göre uygun sınıfları filtreliyoruz
            suitable_classrooms = get_suitable_classrooms(course.type, classrooms, course.student_count)
            if not suitable_classrooms:
                unscheduled_courses.append((course, f"No suitable classrooms available with capacity for {course.student_count} students"))
                continue
            
            # Try to schedule the course
            scheduled = False
            
            # Shuffle to avoid always scheduling at the same time
            random.shuffle(teacher_availability)
            
            for day, start_time, end_time in teacher_availability:
                if scheduled:
                    break
                
                # Shuffle classrooms to distribute classes
                random.shuffle(suitable_classrooms)
                
                for classroom in suitable_classrooms:
                    if not is_conflict(
                        schedule_entries, day, start_time, end_time, 
                        teacher.id, classroom.id, course.department, course.level
                    ):
                        # Add to schedule
                        new_schedule = Schedule(
                            day=day.capitalize(),
                            time_range=f"{start_time}-{end_time}",
                            course_id=course.id,
                            classroom_id=classroom.id
                        )
                        db.add(new_schedule)
                        
                        # Add to our tracking list
                        schedule_entries.append({
                            "day": day,
                            "start_time": start_time,
                            "end_time": end_time,
                            "teacher_id": teacher.id,
                            "classroom_id": classroom.id,
                            "department": course.department,
                            "level": course.level,
                            "student_count": course.student_count
                        })
                        
                        scheduled = True
                        break
            
            if not scheduled:
                unscheduled_courses.append((course, "Could not find suitable time slot"))
        
        # Commit all new schedules to database
        db.commit()
        
        # Get the generated schedule
        new_schedule = db.query(Schedule).options(
            joinedload(Schedule.course),
            joinedload(Schedule.classroom)
        ).all()
        
        # Create schedule summary
        schedule_summary = []
        for entry in new_schedule:
            classroom_capacity = entry.classroom.capacity if entry.classroom else 0
            student_count = entry.course.student_count if entry.course else 0
            capacity_ratio = (student_count / classroom_capacity * 100) if classroom_capacity > 0 else 0
            
            schedule_summary.append({
                "id": entry.id,
                "day": entry.day,
                "time_range": entry.time_range,
                "course": {
                    "id": entry.course.id if entry.course else None,
                    "name": entry.course.name if entry.course else None,
                    "code": entry.course.code if entry.course else None,
                    "teacher_id": entry.course.teacher_id if entry.course else None,
                    "student_count": student_count
                },
                "classroom": {
                    "id": entry.classroom.id if entry.classroom else None,
                    "name": entry.classroom.name if entry.classroom else None,
                    "type": entry.classroom.type if entry.classroom else None,
                    "capacity": classroom_capacity
                },
                "capacity_ratio": round(capacity_ratio, 1)
            })
        
        # Prepare unscheduled course summary
        unscheduled_summary = []
        for course, reason in unscheduled_courses:
            unscheduled_summary.append({
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "student_count": course.student_count,
                "reason": reason
            })
        
        # Görev başarım metrikleri
        scheduled_count = len(schedule_summary)
        unscheduled_count = len(unscheduled_summary)
        total_count = scheduled_count + unscheduled_count
        success_rate = (scheduled_count / total_count * 100) if total_count > 0 else 0
        
        return {
            "success": True,
            "message": f"Schedule generated with {scheduled_count} courses ({round(success_rate, 1)}% success rate)",
            "scheduled_count": scheduled_count,
            "unscheduled_count": unscheduled_count,
            "success_rate": round(success_rate, 1),
            "schedule": schedule_summary,
            "unscheduled": unscheduled_summary
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")

@router.get("/status")
async def get_schedule_status(db: Session = Depends(get_db)):
    """Get schedule generation status"""
    try:
        total_courses = db.query(Course).filter(Course.is_active == True).count()
        scheduled_courses = db.query(Schedule).count()
        
        return {
            "total_active_courses": total_courses,
            "scheduled_courses": scheduled_courses,
            "completion_percentage": round((scheduled_courses / total_courses * 100) if total_courses > 0 else 0, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schedule status: {str(e)}")
