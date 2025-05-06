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

def is_conflict(schedule_entries, day, time_slot, teacher_id, classroom_id, department, level):
    """Check if there's a scheduling conflict with the given parameters"""
    start, end = time_slot.split('-')
    
    for entry in schedule_entries:
        if entry['day'] != day:
            continue
            
        entry_start, entry_end = entry['time_slot'].split('-')
        
        # Zaman çakışması kontrolü
        if (start <= entry_end and end >= entry_start):
            # Aynı öğretmen çakışması
            if entry['teacher_id'] == teacher_id:
                return True
                
            # Aynı sınıf çakışması
            if entry['classroom_id'] == classroom_id:
                return True
                
            # Aynı bölüm ve sınıf seviyesi çakışması 
            if entry['department'] == department and entry['level'] == level:
                return True
                
    return False

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
        
        # Tüm zaman dilimlerini al
        time_slots = get_time_slots()
        
        # Dersler için uygun zaman dilimlerini belirle
        for course in prioritized_courses:
            teacher = teachers.get(course.teacher_id)
            if not teacher:
                unscheduled_courses.append((course, "No teacher assigned"))
                continue
                
            # Öğretmenin çalışma günleri ve saatleri
            teacher_days = teacher.working_days.split(',') if teacher.working_days else []
            if not teacher_days:
                unscheduled_courses.append((course, "Teacher has no available days"))
                continue
                
            # Dersin süresine göre uygun zaman dilimlerini filtrele
            suitable_time_slots = []
            for start, end in time_slots:
                time_slot = f"{start}-{end}"
                duration = calculate_duration(time_slot)
                
                # Ders süreleri için daha esnek eşleştirme:
                # 1 saatlik dersler için 1 saatlik slotlar
                # 2 saatlik dersler için 1.5-2 saat arası slotlar
                # 3 saatlik dersler için 2.5-3 saat arası slotlar
                if course.total_hours == 1 and 0.8 <= duration <= 1.2:
                    suitable_time_slots.append(time_slot)
                elif course.total_hours == 2 and 1.5 <= duration <= 2.2:
                    suitable_time_slots.append(time_slot)
                elif course.total_hours == 3 and 2.5 <= duration <= 3.5:
                    suitable_time_slots.append(time_slot)
                elif abs(duration - course.total_hours) < 0.5:  # Diğer süreler için genel eşleştirme
                    suitable_time_slots.append(time_slot)
                    
            if not suitable_time_slots:
                unscheduled_courses.append((course, f"No suitable time slots for {course.total_hours} hours"))
                continue
                
            # Öğrenci sayısına göre uygun sınıfları filtrele
            suitable_classrooms = []
            for classroom in classrooms:
                if classroom.capacity >= course.student_count:
                    suitable_classrooms.append(classroom)
                    
            if not suitable_classrooms:
                unscheduled_courses.append((course, f"No classroom with capacity for {course.student_count} students"))
                continue
                
            # Ders için tüm olası gün ve zaman kombinasyonlarını dene
            scheduled = False
            random.shuffle(teacher_days)  # Günleri karıştır
            
            for day in teacher_days:
                if scheduled:
                    break
                    
                random.shuffle(suitable_time_slots)  # Zaman dilimlerini karıştır
                
                for time_slot in suitable_time_slots:
                    if scheduled:
                        break
                        
                    random.shuffle(suitable_classrooms)  # Sınıfları karıştır
                    
                    for classroom in suitable_classrooms:
                        if not is_conflict(
                            schedule_entries, day, time_slot, 
                            teacher.id, classroom.id, course.department, course.level
                        ):
                            # Programa ekle
                            new_schedule = Schedule(
                                day=day.capitalize(),
                                time_range=time_slot,
                                course_id=course.id,
                                classroom_id=classroom.id
                            )
                            db.add(new_schedule)
                            
                            # Takip listesine ekle
                            schedule_entries.append({
                                "day": day,
                                "time_slot": time_slot,
                                "teacher_id": teacher.id,
                                "classroom_id": classroom.id,
                                "department": course.department,
                                "level": course.level
                            })
                            
                            scheduled = True
                            break
            
            if not scheduled:
                unscheduled_courses.append((course, "Could not find suitable time slot and classroom"))
        
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
            
            duration = calculate_duration(entry.time_range)
            
            schedule_summary.append({
                "id": entry.id,
                "day": entry.day,
                "time_range": entry.time_range,
                "duration": round(duration, 1),  # Ders süresini ekle
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
        
        # Prepare unscheduled course summary
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
        
        # Calculate metrics
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
