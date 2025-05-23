from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Course, Teacher, Classroom, Schedule, CourseSession
from datetime import datetime, time
from typing import List, Dict, Tuple, Any
import random
import json
import copy
import numpy as np

router = APIRouter()

TIME_BLOCKS = [
    {"start": "08:00", "end": "09:30"},
    {"start": "09:30", "end": "11:00"},
    {"start": "11:00", "end": "12:30"},
    {"start": "13:00", "end": "14:30"},
    {"start": "14:30", "end": "16:00"},
    {"start": "16:00", "end": "17:30"},
    {"start": "17:30", "end": "19:00"}
]

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]

def parse_time(time_str):
    return datetime.strptime(time_str, "%H:%M").time()

def is_time_in_range(time_to_check, start_time, end_time):
    return start_time <= time_to_check <= end_time

def get_teacher_availability(teacher):
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
                if start_time <= block_start and block_end <= end_time:
                    availability.append((day, block["start"], block["end"]))
    return availability

def get_suitable_classrooms(course_type, available_classrooms, student_count):
    suitable_rooms = []
    # Türkçe ve İngilizce tip eşlemesi
    type_mapping = {
        "lab": ["lab", "laboratuvar", "uygulama", "uygulamalı", "uygulamali", "uygulamalı ders", "uygulamali ders", "laboratory"],
        "teorik": ["teorik", "theoretical", "lecture", "teori", "ders"]
    }
    # course_type küçük harfe çevrilerek eşleştirilir
    key = course_type.lower()
    matching_types = type_mapping.get(key, [key])
    for classroom in available_classrooms:
        if classroom.type.lower() in [t.lower() for t in matching_types] and classroom.capacity >= student_count:
            suitable_rooms.append(classroom)
    return suitable_rooms

def get_course_sessions(course, db):
    sessions = db.query(CourseSession).filter(
        CourseSession.course_id == course.id
    ).order_by(CourseSession.type).all()
    return sessions

def is_conflict(schedule_entries, day, time_slot, teacher_id, classroom_id, departments, level):
    start, end = time_slot.split('-')
    for entry in schedule_entries:
        if entry['day'] != day:
            continue
        entry_start, entry_end = entry['time_slot'].split('-')
        if (start <= entry_end and end >= entry_start):
            if entry['teacher_id'] == teacher_id:
                return True
            if entry['classroom_id'] == classroom_id:
                return True
            if any(dept in entry['departments'] for dept in departments) and entry['level'] == level:
                return True
    return False

def generate_time_slots(start_time_str, end_time_str, interval_minutes=30):
    start_h, start_m = map(int, start_time_str.split(':'))
    end_h, end_m = map(int, end_time_str.split(':'))
    slots = []
    current_minutes = start_h * 60 + start_m
    end_minutes = end_h * 60 + end_m
    while current_minutes + interval_minutes <= end_minutes:
        h1 = current_minutes // 60
        m1 = current_minutes % 60
        h2 = (current_minutes + interval_minutes) // 60
        m2 = (current_minutes + interval_minutes) % 60
        slots.append((f"{h1:02d}:{m1:02d}", f"{h2:02d}:{m2:02d}"))
        current_minutes += interval_minutes
    return slots

def find_flexible_slots(available_hours, required_duration):
    # available_hours: ['09:00', '09:30', ...] gibi sıralı saatler
    # required_duration: float (ör. 2 saat)
    slot_minutes = 30
    needed_slots = int(required_duration * 60 / slot_minutes)
    for i in range(len(available_hours) - needed_slots + 1):
        group = available_hours[i:i+needed_slots]
        # Slotlar ardışık mı?
        is_consecutive = True
        for j in range(len(group)-1):
            h1, m1 = map(int, group[j].split(':'))
            h2, m2 = map(int, group[j+1].split(':'))
            if (h2*60 + m2) - (h1*60 + m1) != slot_minutes:
                is_consecutive = False
                break
        if is_consecutive:
            yield group

def has_minimum_break(new_start, new_end, other_start, other_end, min_break=30):
    # Tüm saatler dakika cinsinden
    if new_end <= other_start:
        return other_start - new_end >= min_break
    if other_end <= new_start:
        return new_start - other_end >= min_break
    return True  # Çakışıyorlarsa zaten başka kısıt engeller

def schedule_course_sessions(course, teacher, teacher_days, suitable_time_slots, suitable_classrooms, schedule_entries, db):
    sessions = get_course_sessions(course, db)
    if not sessions:
        return False, "No sessions defined for course"
    departments = [dept.department for dept in course.departments]
    total_students = sum(dept.student_count for dept in course.departments)
    if not departments:
        return False, "Course has no departments assigned"
    sessions.sort(key=lambda x: 0 if x.type == "teorik" else 1)
    scheduled_sessions = []
    teacher_availability = {}
    try:
        teacher_availability = json.loads(getattr(teacher, 'working_hours', '{}'))
    except Exception:
        teacher_availability = {}
    for session in sessions:
        session_scheduled = False
        session_debug = []
        for day in teacher_days:
            day_key = day.lower()
            available_slots = teacher_availability.get(day_key, [])
            if not available_slots:
                session_debug.append(f"{day.capitalize()}: Öğretmen uygun slotu yok")
                continue
            # Esnek slotlar: uygun saatleri sırala
            sorted_hours = sorted(available_slots)
            for slot_group in find_flexible_slots(sorted_hours, session.hours):
                slot_start = slot_group[0]
                slot_end = slot_group[-1]
                h, m = map(int, slot_end.split(':'))
                m += 30
                if m >= 60:
                    h += 1
                    m -= 60
                slot_end_str = f"{h:02d}:{m:02d}"
                time_slot = f"{slot_start}-{slot_end_str}"
                session_suitable_classrooms = get_suitable_classrooms(
                    "Lab" if session.type == "lab" else "Theoretical",
                    suitable_classrooms,
                    total_students
                )
                if not session_suitable_classrooms:
                    session_debug.append(f"{day.capitalize()} {time_slot}: Uygun derslik yok (kapasite/tip)")
                    continue
                random.shuffle(session_suitable_classrooms)
                for classroom in session_suitable_classrooms:
                    if session.type == "lab":
                        theoretical_scheduled = any(
                            s.type == "teorik" and s.course_id == course.id 
                            for s in scheduled_sessions
                        )
                        if not theoretical_scheduled:
                            continue
                    if is_conflict(
                        schedule_entries, day, time_slot, 
                        teacher.id, classroom.id, departments, course.level
                    ):
                        session_debug.append(f"{day.capitalize()} {time_slot}: Çakışma var (öğretmen/derslik/bölüm)")
                        continue
                    # Başarılı planlama
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
                if session_scheduled:
                    break
            if session_scheduled:
                break
        if not session_scheduled:
            debug_msg = "; ".join(session_debug) if session_debug else "Uygun zaman dilimi yok"
            return False, f"{session.hours} saatlik {session.type} oturumu için planlama yapılamadı: {debug_msg}"
    return len(scheduled_sessions) == len(sessions), "All sessions scheduled successfully"

def get_time_slots():
    return [
        ('08:30', '09:30'),
        ('09:45', '10:45'),
        ('11:00', '12:00'),
        ('13:00', '14:00'),
        ('14:15', '15:15'),
        ('15:30', '16:30'),
        ('16:45', '17:45'),
        ('08:30', '10:00'),
        ('10:15', '11:45'),
        ('12:00', '13:30'),
        ('13:45', '15:15'),
        ('15:30', '17:00'),
        ('17:15', '18:45'),
        ('08:30', '10:30'),
        ('10:45', '12:45'),
        ('13:00', '15:00'),
        ('15:15', '17:15'),
        ('08:30', '11:30'),
        ('12:00', '15:00'),
        ('15:30', '18:30')
    ]

def calculate_duration(time_range):
    start, end = time_range.split('-')
    start_h, start_m = map(int, start.split(':'))
    end_h, end_m = map(int, end.split(':'))
    start_minutes = start_h * 60 + start_m
    end_minutes = end_h * 60 + end_m
    return (end_minutes - start_minutes) / 60

def fitness_function(schedule, courses, teachers, classrooms):
    # KUSURSUZ: Herhangi bir kısıt ihlali varsa 0 puan, yoksa yüksek puan
    for i, entry in enumerate(schedule):
        # Çakışma kontrolü (aynı anda aynı öğretmen veya sınıf birden fazla derste olamaz)
        for j, other in enumerate(schedule):
            if i == j:
                continue
            if entry['day'] == other['day'] and entry['time_slot'] == other['time_slot']:
                if entry['teacher_id'] == other['teacher_id'] or entry['classroom_id'] == other['classroom_id']:
                    return 0  # Kısıt ihlali
        # Kapasite uygunluğu
        classroom = next((c for c in classrooms if c.id == entry['classroom_id']), None)
        course = next((c for c in courses if c.id == entry['course_id']), None)
        if classroom and course:
            if getattr(classroom, 'capacity', 0) < getattr(course, 'student_count', 0):
                return 0  # Kısıt ihlali
        # (İsteğe bağlı: Diğer kısıtlar buraya eklenebilir)
    # Hiçbir kısıt ihlali yoksa, programlanan oturum sayısı kadar puan ver
    return len(schedule)

def is_time_overlap(slot1, slot2):
    s1, e1 = slot1.split('-')
    s2, e2 = slot2.split('-')
    sh1, sm1 = map(int, s1.split(':'))
    eh1, em1 = map(int, e1.split(':'))
    sh2, sm2 = map(int, s2.split(':'))
    eh2, em2 = map(int, e2.split(':'))
    start1 = sh1 * 60 + sm1
    end1 = eh1 * 60 + em1
    start2 = sh2 * 60 + sm2
    end2 = eh2 * 60 + em2
    return start1 < end2 and start2 < end1

# 200 100 0.05
def generate_schedule_genetic(courses, teachers, classrooms, db, generations=200, pop_size=100, mutation_rate=0.05):
    time_slots = [f"{start}-{end}" for start, end in get_time_slots()]
    teacher_available_slots = {}
    for teacher in teachers.values():
        available = set()
        try:
            wh = json.loads(getattr(teacher, 'working_hours', '{}'))
            for day, slots in wh.items():
                for i in range(len(slots)-1):
                    slot_start = slots[i]
                    slot_end = slots[i+1]
                    time_slot = f"{slot_start}-{slot_end}"
                    available.add((day.capitalize(), time_slot))
        except Exception:
            pass
        teacher_available_slots[teacher.id] = list(available)
    population = []
    for _ in range(pop_size):
        individual = []
        schedule_entries = []
        course_day_map = {}  # course_id -> set of days used
        for course in courses:
            teacher = teachers.get(course.teacher_id)
            if not teacher:
                continue
            for session in get_course_sessions(course, db):
                available_slots = teacher_available_slots.get(teacher.id, [])
                slots_by_day = {}
                for day, slot in available_slots:
                    slots_by_day.setdefault(day, []).append(slot)
                found_slot = False
                for day, slots in slots_by_day.items():
                    # --- YENİ KISIT: Aynı dersin başka bir oturumu o gün atanmış mı? ---
                    if course.id in course_day_map and day in course_day_map[course.id]:
                        continue  # Bu gün bu ders için zaten kullanıldı
                    slot_starts = sorted([s.split('-')[0] for s in slots])
                    for group in find_flexible_slots(slot_starts, session.hours):
                        slot_start = group[0]
                        slot_end = group[-1]
                        h, m = map(int, slot_end.split(':'))
                        m += 30
                        if m >= 60:
                            h += 1
                            m -= 60
                        slot_end_str = f"{h:02d}:{m:02d}"
                        time_slot = f"{slot_start}-{slot_end_str}"
                        suitable_classrooms = get_suitable_classrooms(session.type, classrooms, sum([d.student_count for d in course.departments]))
                        if not suitable_classrooms:
                            continue
                        random.shuffle(suitable_classrooms)
                        for classroom in suitable_classrooms:
                            if any(
                                e['day'] == day and (
                                    (is_time_overlap(e['time_slot'], time_slot)) and (
                                        e['teacher_id'] == teacher.id or
                                        e['classroom_id'] == classroom.id or
                                        (set(e['departments']) & set([d.department for d in course.departments]) and e['level'] == course.level)
                                    )
                                ) for e in schedule_entries
                            ):
                                continue
                            # GÜNLÜK 8 SAAT KISITI
                            total_hours = session.hours
                            for e in schedule_entries:
                                if e['day'] == day and e['level'] == course.level and set(e['departments']) & set([d.department for d in course.departments]):
                                    total_hours += e['session_hours']
                            if total_hours > 8:
                                continue
                            # EN AZ 30 DK ARA KISITI
                            new_start_h, new_start_m = map(int, slot_start.split(':'))
                            new_end_h, new_end_m = h, m
                            new_start_min = new_start_h * 60 + new_start_m
                            new_end_min = new_end_h * 60 + new_end_m
                            min_break_ok = True
                            for e in schedule_entries:
                                if e['day'] == day and e['level'] == course.level and set(e['departments']) & set([d.department for d in course.departments]):
                                    e_start, e_end = e['time_slot'].split('-')
                                    e_start_h, e_start_m = map(int, e_start.split(':'))
                                    e_end_h, e_end_m = map(int, e_end.split(':'))
                                    e_start_min = e_start_h * 60 + e_start_m
                                    e_end_min = e_end_h * 60 + e_end_m
                                    if not has_minimum_break(new_start_min, new_end_min, e_start_min, e_end_min, 30):
                                        min_break_ok = False
                                        break
                            if not min_break_ok:
                                continue
                            gene = {
                                'day': day,
                                'time_slot': time_slot,
                                'teacher_id': teacher.id,
                                'classroom_id': classroom.id,
                                'course_id': course.id,
                                'session_type': session.type,
                                'session_hours': session.hours,
                                'departments': [d.department for d in course.departments],
                                'level': course.level
                            }
                            individual.append(gene)
                            schedule_entries.append(gene)
                            # --- GÜNÜ KAYDET ---
                            if course.id not in course_day_map:
                                course_day_map[course.id] = set()
                            course_day_map[course.id].add(day)
                            found_slot = True
                            break
                        if found_slot:
                            break
                    if found_slot:
                        break
        population.append(individual)
    # Evrim döngüsü
    for gen in range(generations):
        fitness_scores = [fitness_function(ind, courses, teachers.values(), classrooms) for ind in population]
        filtered_population = [ind for ind, fit in zip(population, fitness_scores) if fit > 0]
        if not filtered_population:
            filtered_population = population
        selected = []
        for _ in range(pop_size):
            i, j = np.random.randint(0, len(filtered_population), 2)
            fit_i = fitness_function(filtered_population[i], courses, teachers.values(), classrooms)
            fit_j = fitness_function(filtered_population[j], courses, teachers.values(), classrooms)
            winner = filtered_population[i] if fit_i > fit_j else filtered_population[j]
            selected.append(copy.deepcopy(winner))
        next_population = []
        for i in range(0, pop_size, 2):
            parent1 = selected[i]
            parent2 = selected[(i+1)%pop_size]
            cut = np.random.randint(1, len(parent1)) if len(parent1) > 1 else 1
            child1 = parent1[:cut] + parent2[cut:]
            child2 = parent2[:cut] + parent1[cut:]
            next_population.extend([child1, child2])
        # Mutasyon (esnek slot ile, çakışma kontrolüyle)
        for ind in next_population:
            if np.random.rand() < mutation_rate:
                if ind:
                    gene = np.random.choice(ind)
                    teacher_id = gene['teacher_id']
                    session_hours = gene.get('session_hours', 1)
                    available_slots = teacher_available_slots.get(teacher_id, [])
                    slots_by_day = {}
                    for day, slot in available_slots:
                        slots_by_day.setdefault(day, []).append(slot)
                    found_slot = False
                    for day, slots in slots_by_day.items():
                        slot_starts = sorted([s.split('-')[0] for s in slots])
                        for group in find_flexible_slots(slot_starts, session_hours):
                            slot_start = group[0]
                            slot_end = group[-1]
                            h, m = map(int, slot_end.split(':'))
                            m += 30
                            if m >= 60:
                                h += 1
                                m -= 60
                            slot_end_str = f"{h:02d}:{m:02d}"
                            time_slot = f"{slot_start}-{slot_end_str}"
                            # Güçlü çakışma kontrolü (sınıf, öğretmen, bölüm-level + zaman aralığı çakışması)
                            if any(
                                e is not gene and e['day'] == day and (
                                    (is_time_overlap(e['time_slot'], time_slot)) and (
                                        e['teacher_id'] == teacher_id or
                                        e['classroom_id'] == gene['classroom_id'] or
                                        (set(e['departments']) & set(gene['departments']) and e['level'] == gene['level'])
                                    )
                                ) for e in ind
                            ):
                                continue
                            # --- GÜNLÜK 8 SAAT KISITI (mutasyon) ---
                            total_hours = session_hours
                            for e in ind:
                                if e is not gene and e['day'] == day and e['level'] == gene['level'] and set(e['departments']) & set(gene['departments']):
                                    total_hours += e['session_hours']
                            if total_hours > 8:
                                continue
                            # --- EN AZ 30 DK ARA KISITI (mutasyon) ---
                            new_start_h, new_start_m = map(int, slot_start.split(':'))
                            new_end_h, new_end_m = h, m
                            new_start_min = new_start_h * 60 + new_start_m
                            new_end_min = new_end_h * 60 + new_end_m
                            min_break_ok = True
                            for e in ind:
                                if e is not gene and e['day'] == day and e['level'] == gene['level'] and set(e['departments']) & set(gene['departments']):
                                    e_start, e_end = e['time_slot'].split('-')
                                    e_start_h, e_start_m = map(int, e_start.split(':'))
                                    e_end_h, e_end_m = map(int, e_end.split(':'))
                                    e_start_min = e_start_h * 60 + e_start_m
                                    e_end_min = e_end_h * 60 + e_end_m
                                    if not has_minimum_break(new_start_min, new_end_min, e_start_min, e_end_min, 30):
                                        min_break_ok = False
                                        break
                            if not min_break_ok:
                                continue
                            gene['day'] = day
                            gene['time_slot'] = time_slot
                            found_slot = True
                            break
                        if found_slot:
                            break
        population = next_population[:pop_size]
    # En iyi bireyi bul
    fitness_scores = [fitness_function(ind, courses, teachers.values(), classrooms) for ind in population]
    best_idx = np.argmax(fitness_scores)
    best_schedule = population[best_idx]
    # Veritabanına kaydet
    db.query(Schedule).delete()
    for entry in best_schedule:
        new_schedule = Schedule(
            day=entry['day'],
            time_range=entry['time_slot'],
            course_id=entry['course_id'],
            classroom_id=entry['classroom_id']
        )
        db.add(new_schedule)
    db.commit()
    # Sonuçları hazırla
    new_schedule_db = db.query(Schedule).options(
        joinedload(Schedule.course),
        joinedload(Schedule.classroom)
    ).all()
    schedule_summary = []
    for entry in new_schedule_db:
        classroom_capacity = entry.classroom.capacity if entry.classroom else 0
        course = entry.course
        if course and hasattr(course, 'departments') and course.departments:
            student_count = sum(getattr(dept, 'student_count', 0) for dept in course.departments)
        else:
            student_count = getattr(course, 'student_count', 0) if course else 0
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
    # --- Başarı oranı ve programlanamayanlar ---
    # Tüm oturumları (ders+oturum) bazında kontrol et
    all_sessions = []
    for course in courses:
        for session in get_course_sessions(course, db):
            all_sessions.append({
                "course": course,
                "session": session
            })
    scheduled_keys = set()
    for s in schedule_summary:
        if s["course"] and s["course"]["id"] is not None and s["duration"]:
            # duration ile CourseSession.hours neredeyse eşitse programlanmış say
            scheduled_keys.add((s["course"]["id"], round(s["duration"], 2)))
    unscheduled_summary = []
    for item in all_sessions:
        course = item["course"]
        session = item["session"]
        # duration ile hours neredeyse eşit mi kontrol et
        found = False
        for key in scheduled_keys:
            if key[0] == course.id and abs(key[1] - session.hours) < 0.1:
                found = True
                break
        if not found:
            if hasattr(course, 'departments') and course.departments:
                student_count = sum(getattr(d, 'student_count', 0) for d in course.departments)
            else:
                student_count = getattr(course, 'student_count', 0)
            unscheduled_summary.append({
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "total_hours": session.hours,
                "student_count": student_count,
                "reason": "Oturum programlanamadı (genetik)"
            })
    scheduled_count = len(schedule_summary)
    unscheduled_count = len(unscheduled_summary)
    total_count = scheduled_count + unscheduled_count
    success_rate = (scheduled_count / total_count * 100) if total_count > 0 else 0
    return {
        "success": True,
        "message": f"Genetik algoritma ile program oluşturuldu. {scheduled_count} oturum planlandı.",
        "scheduled_count": scheduled_count,
        "unscheduled_count": unscheduled_count,
        "success_rate": round(success_rate, 1),
        "schedule": schedule_summary,
        "unscheduled": unscheduled_summary,
        "perfect": fitness_function(best_schedule, courses, teachers.values(), classrooms) == len(best_schedule)
    }

@router.post("/generate")
async def generate_schedule(db: Session = Depends(get_db)):
    try:
        active_courses = db.query(Course).filter(Course.is_active == True).options(
            joinedload(Course.teacher)
        ).all()
        if not active_courses:
            return {"message": "Programlanacak aktif ders bulunamadı"}
        teachers = {teacher.id: teacher for teacher in db.query(Teacher).all()}
        classrooms = db.query(Classroom).all()
        if not classrooms:
            return {"message": "Programlama için uygun derslik bulunamadı"}
        return generate_schedule_genetic(active_courses, teachers, classrooms, db)
    except Exception as e:
        import traceback
        print(f"[ERROR] generate_schedule: {e}\n{traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Program oluşturulurken hata: {str(e)}")

@router.get("/status")
async def get_schedule_status(db: Session = Depends(get_db)):
    try:
        active_courses = db.query(Course).filter(Course.is_active == True).all()
        active_course_ids = [c.id for c in active_courses]
        total_active_sessions = db.query(CourseSession).filter(CourseSession.course_id.in_(active_course_ids)).count() if active_course_ids else 0

        scheduled_sessions = 0
        if active_course_ids and total_active_sessions > 0:
            # Her CourseSession için bir eşleşen Schedule var mı kontrol et
            sessions = db.query(CourseSession).filter(CourseSession.course_id.in_(active_course_ids)).all()
            schedules = db.query(Schedule).filter(Schedule.course_id.in_(active_course_ids)).all()
            for session in sessions:
                found = False
                for sched in schedules:
                    # Schedule'daki time_range'den süreyi hesapla
                    try:
                        start, end = sched.time_range.split('-')
                        sh, sm = map(int, start.split(':'))
                        eh, em = map(int, end.split(':'))
                        duration = (eh * 60 + em - sh * 60 - sm) / 60
                    except Exception:
                        continue
                    if sched.course_id == session.course_id and abs(session.hours - duration) < 0.1:
                        found = True
                        break
                if found:
                    scheduled_sessions += 1

        completion_percentage = round((scheduled_sessions / total_active_sessions * 100) if total_active_sessions > 0 else 0, 2)
        return {
            "total_active_courses": len(active_courses),
            "total_active_sessions": total_active_sessions,
            "scheduled_sessions": scheduled_sessions,
            "completion_percentage": completion_percentage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Program durumu alınırken hata: {str(e)}") 