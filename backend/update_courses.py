from sqlalchemy.orm import Session, joinedload
from database import SessionLocal, engine
from models import Course, CourseSession

def update_courses():
    db = SessionLocal()
    try:
        # Tüm dersleri oturumlarıyla birlikte al
        courses = db.query(Course).options(joinedload(Course.sessions)).all()
        
        updated_count = 0
        
        # Her ders için değerleri güncelle
        for course in courses:
            updated = False
            
            # type alanını kontrol et ve gerekirse güncelle
            if not course.type:
                course.type = "Core"  # Varsayılan değer
                updated = True
            
            # total_hours değerini oturumlardan hesapla
            if course.sessions:
                total_hours = sum(session.hours for session in course.sessions)
                if course.total_hours != total_hours:
                    course.total_hours = total_hours
                    updated = True
                    print(f"Ders: {course.name}, Hesaplanan saat: {total_hours}")
            elif not course.total_hours:
                # Oturum yoksa varsayılan değer ata
                course.total_hours = 2
                updated = True
                print(f"Ders: {course.name}, Varsayılan saat: 2 (session yok)")
            
            # Eğer değişiklik yapıldıysa kaydet
            if updated:
                db.add(course)
                updated_count += 1
        
        # Değişiklikleri kaydet
        db.commit()
        print(f"{updated_count} ders başarıyla güncellendi.")
    except Exception as e:
        db.rollback()
        print(f"Hata oluştu: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_courses() 