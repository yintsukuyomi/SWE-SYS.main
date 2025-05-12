from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Course, Teacher, Classroom, Schedule, CourseSession
from datetime import datetime, time
from typing import List, Dict, Tuple, Any
import random

router = APIRouter()

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
        "Lab": ["Lab"],
        "Theoretical": ["Theoretical"]
    }
    
    matching_types = type_mapping.get(course_type, ["Theoretical"])
    
    for classroom in available_classrooms:
        # Check if classroom type matches and has sufficient capacity
        if classroom.type in matching_types and classroom.capacity >= student_count:
            suitable_rooms.append(classroom)
    
    return suitable_rooms

def get_course_sessions(course, db):
    """Get all sessions for a course, sorted by type (theoretical first, then lab)"""
    sessions = db.query(CourseSession).filter(
        CourseSession.course_id == course.id
    ).order_by(CourseSession.type).all()
    return sessions

def is_conflict(schedule_entries, day, time_slot, teacher_id, classroom_id, departments, level):
    """Check if there's a scheduling conflict with the given parameters"""
    start, end = time_slot.split('-')
    
    for entry in schedule_entries:
        if entry['day'] != day:
            continue
            
        entry_start, entry_end = entry['time_slot'].split('-')
        
        # Time conflict check
        if (start <= entry_end and end >= entry_start):
            # Same teacher conflict
            if entry['teacher_id'] == teacher_id:
                return True
                
            # Same classroom conflict
            if entry['classroom_id'] == classroom_id:
                return True
                
            # Same department and level conflict
            if any(dept in entry['departments'] for dept in departments) and entry['level'] == level:
                return True
                
    return False

def schedule_course_sessions(course, teacher, teacher_days, suitable_time_slots, suitable_classrooms, schedule_entries, db):
    """Schedule all sessions for a course"""
    sessions = get_course_sessions(course, db)
    if not sessions:
        return False, "No sessions defined for course"
    
    # Get course departments
    departments = [dept.department for dept in course.departments]
    if not departments:
        return False, "Course has no departments assigned"
    
    # Sort sessions to ensure theoretical sessions come before lab sessions
    sessions.sort(key=lambda x: 0 if x.type == "teorik" else 1)
    
    scheduled_sessions = []
    for session in sessions:
        session_scheduled = False
        random.shuffle(teacher_days)
        
        # Get suitable time slots for this specific session
        session_suitable_time_slots = []
        for time_slot in suitable_time_slots:
            duration = calculate_duration(time_slot)
            # Match time slots to session duration with some flexibility
            if abs(duration - session.hours) <= 0.5:
                session_suitable_time_slots.append(time_slot)
        
        if not session_suitable_time_slots:
            return False, f"{session.hours} saatlik {session.type} oturumu için uygun zaman dilimi yok"
        
        for day in teacher_days:
            if session_scheduled:
                break
                
            random.shuffle(session_suitable_time_slots)
            for time_slot in session_suitable_time_slots:
                if session_scheduled:
                    break
                    
                # Get suitable classrooms for this session type
                session_suitable_classrooms = get_suitable_classrooms(
                    "Lab" if session.type == "lab" else "Theoretical",
                    suitable_classrooms,
                    sum(dept.student_count for dept in course.departments)  # Total students from all departments
                )
                
                if not session_suitable_classrooms:
                    return False, f"{session.type} oturumu için uygun derslik yok"
                
                random.shuffle(session_suitable_classrooms)
                for classroom in session_suitable_classrooms:
                    # For lab sessions, check if theoretical session is already scheduled
                    if session.type == "lab":
                        theoretical_scheduled = any(
                            s.type == "teorik" and s.course_id == course.id 
                            for s in scheduled_sessions
                        )
                        if not theoretical_scheduled:
                            continue
                    
                    if not is_conflict(
                        schedule_entries, day, time_slot, 
                        teacher.id, classroom.id, departments, course.level
                    ):
                        new_schedule = Schedule(
                            day=day.capitalize(),
                            time_range=time_slot,
                            course_id=course.id,
                            classroom_id=classroom.id
                        )
                        db.add(new_schedule)
                        schedule_entries.append({
                            "day": day,
                            "time_slot": time_slot,
                            "teacher_id": teacher.id,
                            "classroom_id": classroom.id,
                            "departments": departments,
                            "level": course.level,
                            "session_type": session.type,
                            "session_hours": session.hours
                        })
                        scheduled_sessions.append(session)
                        session_scheduled = True
                        break
    
    return len(scheduled_sessions) == len(sessions), "All sessions scheduled successfully"

def get_time_slots():
    """Define standard time slots for scheduling"""
    return [
        # 1 saatlik zaman dilimleri
        ('08:30', '09:30'),
        ('09:45', '10:45'),
        ('11:00', '12:00'),
        ('13:00', '14:00'),
        ('14:15', '15:15'),
        ('15:30', '16:30'),
        ('16:45', '17:45'),
        
        # 1.5 saatlik zaman dilimleri
        ('08:30', '10:00'),
        ('10:15', '11:45'),
        ('12:00', '13:30'),
        ('13:45', '15:15'),
        ('15:30', '17:00'),
        ('17:15', '18:45'),
        
        # 2 saatlik zaman dilimleri
        ('08:30', '10:30'),
        ('10:45', '12:45'),
        ('13:00', '15:00'),
        ('15:15', '17:15'),
        
        # 3 saatlik zaman dilimleri
        ('08:30', '11:30'),
        ('12:00', '15:00'),
        ('15:30', '18:30')
    ]

def calculate_duration(time_range):
    """Calculate the duration of a time slot in hours"""
    start, end = time_range.split('-')
    start_h, start_m = map(int, start.split(':'))
    end_h, end_m = map(int, end.split(':'))
    
    start_minutes = start_h * 60 + start_m
    end_minutes = end_h * 60 + end_m
    
    # Süreyi saat olarak geri döndür
    return (end_minutes - start_minutes) / 60

@router.post("/generate")
async def generate_schedule(db: Session = Depends(get_db)):
    """Generate a complete class schedule"""
    try:
        # 1. Preprocessing
        active_courses = db.query(Course).filter(Course.is_active == True).options(
            joinedload(Course.teacher)
        ).all()
        if not active_courses:
            return {"message": "Programlanacak aktif ders bulunamadı"}
            
        teachers = {teacher.id: teacher for teacher in db.query(Teacher).all()}
        classrooms = db.query(Classroom).all()
        if not classrooms:
            return {"message": "Programlama için uygun derslik bulunamadı"}
            
        # Clear existing schedule
        db.query(Schedule).delete()
        db.commit()
        
        # Sort courses by priority
        prioritized_courses = sorted(
            active_courses, 
            key=lambda c: (
                0 if c.type == "Lab" else 1,  # Lab courses have higher priority
                -c.ects,
                -c.total_hours,
                -c.student_count
            )
        )
        
        schedule_entries = []
        unscheduled_courses = []
        time_slots = get_time_slots()
        
        for course in prioritized_courses:
            teacher = teachers.get(course.teacher_id)
            if not teacher:
                unscheduled_courses.append((course, "Derse atanmış öğretmen yok"))
                continue
                
            teacher_days = teacher.working_days.split(',') if teacher.working_days else []
            if not teacher_days:
                unscheduled_courses.append((course, "Öğretmenin uygun günü yok"))
                continue
                
            # Get all possible time slots
            suitable_time_slots = [f"{start}-{end}" for start, end in time_slots]
            
            # Get all possible classrooms
            suitable_classrooms = classrooms
            
            # Schedule all sessions for the course
            success, message = schedule_course_sessions(
                course, teacher, teacher_days, suitable_time_slots, 
                suitable_classrooms, schedule_entries, db
            )
            
            if not success:
                unscheduled_courses.append((course, message))
                
        db.commit()
        new_schedule = db.query(Schedule).options(
            joinedload(Schedule.course),
            joinedload(Schedule.classroom)
        ).all()
        schedule_summary = []
        for entry in new_schedule:
            classroom_capacity = entry.classroom.capacity if entry.classroom else 0
            student_count = entry.course.student_count if entry.course else 0
            capacity_ratio = (student_count / classroom_capacity * 100) if classroom_capacity > 0 else 0
            duration = calculate_duration(entry.time_range)
            schedule_summary.append({
                "id": entry.id,
                "day": entry.day,
                "time_range": entry.time_range,
                "duration": round(duration, 1),
                "course": {
                    "id": entry.course.id if entry.course else None,
                    "name": entry.course.name if entry.course else None,
                    "code": entry.course.code if entry.course else None,
                    "teacher_id": entry.course.teacher_id if entry.course else None,
                    "total_hours": entry.course.total_hours if entry.course else None,
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
        unscheduled_summary = []
        for course, reason in unscheduled_courses:
            unscheduled_summary.append({
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "total_hours": course.total_hours,
                "student_count": course.student_count,
                "reason": reason
            })
        scheduled_count = len(schedule_summary)
        unscheduled_count = len(unscheduled_summary)
        total_count = scheduled_count + unscheduled_count
        success_rate = (scheduled_count / total_count * 100) if total_count > 0 else 0
        return {
            "success": True,
            "message": f"Program oluşturuldu: {scheduled_count} ders programlandı (%{round(success_rate, 1)} başarı oranı)",
            "scheduled_count": scheduled_count,
            "unscheduled_count": unscheduled_count,
            "success_rate": round(success_rate, 1),
            "schedule": schedule_summary,
            "unscheduled": unscheduled_summary
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Program oluşturulurken hata: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Program durumu alınırken hata: {str(e)}")
