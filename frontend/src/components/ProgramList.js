import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import { getCourses, getSchedules } from '../api';
import '../styles/ProgramList.css';
import '../styles/CourseList.css';
import '../styles/ListView.css';
import '../styles/SearchStyles.css';

const LEVELS = [
  { id: 'prep', name: 'Hazırlık Sınıfı', icon: '🔍' },
  { id: 'year1', name: '1. Sınıf', icon: '1️⃣' },
  { id: 'year2', name: '2. Sınıf', icon: '2️⃣' },
  { id: 'year3', name: '3. Sınıf', icon: '3️⃣' },
  { id: 'year4', name: '4. Sınıf', icon: '4️⃣' },
  { id: 'graduate', name: 'Yüksek Lisans', icon: '🎓' },
  { id: 'phd', name: 'Doktora', icon: '🔬' }
];

// Map string level values to IDs
const getLevelId = (levelString) => {
  if (levelString.includes('Preparatory')) return 'prep';
  if (levelString.includes('Year 1')) return 'year1';
  if (levelString.includes('Year 2')) return 'year2';
  if (levelString.includes('Year 3')) return 'year3';
  if (levelString.includes('Year 4')) return 'year4';
  if (levelString.includes('Graduate')) return 'graduate';
  if (levelString.includes('PhD')) return 'phd';
  return 'year1';  // Default to year 1
};

const ProgramList = ({ token }) => {
  const { facultyId, departmentId } = useParams();
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' veya 'schedule'
  const [searchTerm, setSearchTerm] = useState('');

  const faculty = FACULTIES.find(f => f.id === facultyId);
  const departments = getDepartmentsByFaculty(facultyId);
  const department = departments.find(d => d.id === departmentId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Kurs ve program verilerini paralel olarak al
        const [coursesData, schedulesData] = await Promise.all([
          getCourses(token),
          getSchedules(token)
        ]);
        
        // Fakülte ve bölüme göre filtreleme
        const facultyName = faculty ? faculty.name : '';
        const departmentName = department ? department.name : '';
        
        const filteredCourses = coursesData.filter(course => 
          course.faculty === facultyName && course.department === departmentName
        );
        
        // İlgili derslerin ID'lerini al
        const courseIds = filteredCourses.map(course => course.id);
        
        // Bu bölüme ait olan programları filtrele
        const filteredSchedules = schedulesData.filter(schedule => 
          schedule.course && courseIds.includes(schedule.course.id)
        );
        
        setCourses(filteredCourses);
        setSchedules(filteredSchedules);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    if (faculty && department) {
      fetchData();
    } else {
      setLoading(false);
      setError('Invalid faculty or department');
    }
  }, [token, faculty, department]);

  if (!faculty || !department) {
    return (
      <div className="program-list-container">
        <div className="error-message">Faculty or department not found</div>
        <Link to="/faculties" className="back-link">Back to Faculties</Link>
      </div>
    );
  }

  // Group courses by level
  const coursesByLevel = {};
  
  LEVELS.forEach(level => {
    coursesByLevel[level.id] = courses.filter(course => getLevelId(course.level) === level.id);
  });
  
  // Haftalık program için 30 dakikalık slotlar
  const timeSlots = [
    '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
    '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
    '12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00',
    '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00',
    '16:00-16:30', '16:30-17:00'
  ];
  
  // Slot ile ders zaman aralığı çakışıyorsa eşleşsin
  const matchTimeSlot = (schedule) => {
    const { time_range } = schedule;
    const [scheduleStart, scheduleEnd] = time_range.split('-');
    const toMinutes = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const sStart = toMinutes(scheduleStart);
    const sEnd = toMinutes(scheduleEnd);
    for (const slot of timeSlots) {
      const [slotStart, slotEnd] = slot.split('-');
      const slotS = toMinutes(slotStart);
      const slotE = toMinutes(slotEnd);
      // Slot, dersin aralığına tamamen dahilse veya çakışıyorsa
      if (slotS >= sStart && slotE <= sEnd) {
        return slot;
      }
    }
    // Eşleşme bulunamazsa ilk slotu döndür
    return timeSlots[0];
  };
  
  // Ders süresine göre genişlik hesaplama
  const getCourseSpan = (schedule) => {
    const { time_range } = schedule;
    const [start, end] = time_range.split('-');
    
    const toMinutes = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    
    // Süreyi saat cinsinden hesapla
    const duration = (endMinutes - startMinutes) / 60;
    
    // Ders süresine göre sınıf (rowspan/colspan) belirle
    if (duration <= 1.5) return 1;  // Normal aralık
    if (duration <= 2.5) return 2;  // 2-2.5 saatlik dersler
    return 3;                      // 3 saatlik veya daha uzun dersler
  };
  
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  
  // Haftalık programa göre dersleri düzenle
  const organizeScheduleByLevel = () => {
    const scheduleByLevel = {};
    
    // Her seviye için boş program oluştur
    LEVELS.forEach(level => {
      scheduleByLevel[level.id] = {
        hasSchedules: false,
        schedule: {}
      };
      
      // Her gün için boş program oluştur
      days.forEach(day => {
        scheduleByLevel[level.id].schedule[day] = {};
        
        // Her saat dilimi için boş program oluştur
        timeSlots.forEach(slot => {
          scheduleByLevel[level.id].schedule[day][slot] = null;
        });
      });
    });
    
    // Programları yerleştir
    schedules.forEach(schedule => {
      if (!schedule.course) return;
      
      const levelId = getLevelId(schedule.course.level);
      const day = schedule.day;
      
      // Zaman aralığını kontrol et ve en uygun zaman dilimine yerleştir
      const matchedTimeSlot = matchTimeSlot(schedule);
      
      if (scheduleByLevel[levelId]?.schedule?.[day]?.[matchedTimeSlot] === null) {
        scheduleByLevel[levelId].schedule[day][matchedTimeSlot] = schedule;
        scheduleByLevel[levelId].hasSchedules = true;
        
        // Uzun dersler için span bilgisini ekle
        schedule.courseSpan = getCourseSpan(schedule);
      }
    });
    
    return scheduleByLevel;
  };
  
  const scheduleByLevel = organizeScheduleByLevel();

  if (loading) {
    return <div className="loading">Programlar yükleniyor...</div>;
  } else if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="program-list-container">
      <div className="list-header">
        <div className="header-content">
          <h1>{department.name}</h1>
          <p className="list-subtitle">{faculty.name} - Akademik yıla göre programlar ve dersler</p>
        </div>
        <div className="header-actions">
          <Link to={`/faculties/${facultyId}`} className="back-button">
            ← Bölümlere Dön
          </Link>
          <Link to="/faculties" className="back-button">
            ← Fakültelere Dön
          </Link>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} 
              onClick={() => setViewMode('list')}
            >
              Liste Görünümü
            </button>
            <button 
              className={`view-btn ${viewMode === 'schedule' ? 'active' : ''}`} 
              onClick={() => setViewMode('schedule')}
            >
              Program Görünümü
            </button>
          </div>
        </div>
      </div>
      
      <div className="search-container with-search-icon">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Ders ara..."
          value={searchTerm || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search-btn" 
            onClick={() => setSearchTerm('')}
            title="Aramayı Temizle"
          >
            ×
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="loading">Programlar yükleniyor...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="level-sections">
          {Object.keys(coursesByLevel).length > 0 ? (
            Object.keys(coursesByLevel).map(level => {
              const levelCourses = coursesByLevel[level] || [];
              const levelSchedule = scheduleByLevel[level];
              
              // Bu seviyede hiçbir kurs yoksa, gösterme
              if (levelCourses.length === 0) return null;
              
              const levelInfo = LEVELS.find(l => l.id === level) || {};
              
              return (
                <div key={level} className="level-section">
                  <h2 className="level-title">
                    <span className="level-icon">{levelInfo.icon}</span> {levelInfo.name}
                  </h2>
                  
                  {viewMode === 'list' ? (
                    <div className="course-list">
                      {levelCourses.map(course => (
                        <div className="course-item" key={course.id}>
                          <div className="course-details">
                            <div className="course-code-name">
                              <span className="course-code">{course.code}</span>
                              <span className="course-name">{course.name}</span>
                            </div>
                            <div className="course-meta-row">
                              {course.teacher && (
                                <span className="teacher-name">{course.teacher.name}</span>
                              )}
                              <span className="course-category">
                                {course.category === 'zorunlu' ? 'Zorunlu' : 'Seçmeli'}
                              </span>
                              {course.sessions.map((session, index) => (
                                <span key={index} className="session-info">
                                  {session.type === 'teorik' ? 'Teorik' : 'Lab'}: {session.hours} saat
                                </span>
                              ))}
                              <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                                {course.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </div>
                          <div className="course-actions">
                            <Link to={`/courses/edit/${course.id}`} className="view-details-btn">
                              Detaylar
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="program-table">
                      <thead>
                        <tr>
                          <th>Ders Kodu</th>
                          <th>Ders Adı</th>
                          <th>Oturumlar</th>
                          <th>ECTS</th>
                          <th>Öğrenci</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelCourses.map(course => (
                          <tr key={course.id} className={course.is_active ? 'active-course' : 'inactive-course'}>
                            <td className="course-code">{course.code}</td>
                            <td>{course.name}</td>
                            <td>
                              {course.sessions.map((session, index) => (
                                <div key={index} className="session-info">
                                  {session.type === 'teorik' ? 'T' : 'L'}: {session.hours} saat
                                </div>
                              ))}
                            </td>
                            <td className="text-center">{course.ects}</td>
                            <td className="text-center">{course.student_count || 0}</td>
                            <td>
                              <Link to={`/courses/edit/${course.id}`} className="view-course-btn">
                                Detaylar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-data-message">Henüz ders eklenmemiş.</div>
          )}
        </div>
      )}
    </div>
  );
};

// Schedule view tablosunda ders hücresi oluşturma
const renderScheduleCell = (day, slot, levelSchedule) => {
  const scheduleItem = levelSchedule.schedule[day][slot];
  
  if (!scheduleItem) {
    return <td key={`${day}-${slot}`} className="schedule-cell"></td>;
  }
  
  const courseSpan = scheduleItem.courseSpan || 1;
  
  return (
    <td 
      key={`${day}-${slot}`}
      className={`schedule-cell has-class span-${courseSpan}`}
      colSpan={courseSpan > 1 ? courseSpan : undefined}
    >
      <div className="schedule-item">
        <div className="course-code">{scheduleItem.course.code}</div>
        <div className="course-name">{scheduleItem.course.name}</div>
        <div className="course-hours">({scheduleItem.course.total_hours} hours)</div>
        <div className="room-info">
          {scheduleItem.classroom && `Room: ${scheduleItem.classroom.name}`}
        </div>
      </div>
    </td>
  );
};

export default ProgramList;
