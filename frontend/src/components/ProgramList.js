import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import { getCourses, getSchedules } from '../api';
import '../styles/ProgramList.css';

const LEVELS = [
  { id: 'prep', name: 'Preparatory Year', icon: '🔍' },
  { id: 'year1', name: 'Year 1', icon: '1️⃣' },
  { id: 'year2', name: 'Year 2', icon: '2️⃣' },
  { id: 'year3', name: 'Year 3', icon: '3️⃣' },
  { id: 'year4', name: 'Year 4', icon: '4️⃣' },
  { id: 'graduate', name: 'Graduate', icon: '🎓' },
  { id: 'phd', name: 'PhD', icon: '🔬' }
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
  
  // Ders programı tablosu için haftalık saat aralıklarını tanımla
  const timeSlots = [
    '08:30-10:00', '10:15-11:45', '12:00-13:30', 
    '13:45-15:15', '15:30-17:00', '17:15-18:45'
  ];
  
  // Ders süresine göre aralık eşleştirme
  const matchTimeSlot = (schedule) => {
    const { time_range } = schedule;
    
    // Tam eşleşme kontrolü
    if (timeSlots.includes(time_range)) {
      return time_range;
    }
    
    // Zaman dilimleri arasında çakışma kontrolü
    const [scheduleStart, scheduleEnd] = time_range.split('-');
    
    for (const slot of timeSlots) {
      const [slotStart, slotEnd] = slot.split('-');
      
      // Başlangıç saati aynıysa veya yakınsa eşleştir
      if (scheduleStart === slotStart || Math.abs(parseTime(scheduleStart) - parseTime(slotStart)) < 15) {
        return slot;
      }
    }
    
    // Eşleşme bulunamadı, varsayılan değer döndür
    return timeSlots[0];
  };
  
  // Saat formatını dakika cinsinden sayısal değere dönüştürme
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Ders süresine göre genişlik hesaplama
  const getCourseSpan = (schedule) => {
    const { time_range } = schedule;
    const [start, end] = time_range.split('-');
    
    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    
    // Süreyi saat cinsinden hesapla
    const duration = (endMinutes - startMinutes) / 60;
    
    // Ders süresine göre sınıf (rowspan/colspan) belirle
    if (duration <= 1.5) return 1;  // Normal aralık
    if (duration <= 2.5) return 2;  // 2-2.5 saatlik dersler
    return 3;                      // 3 saatlik veya daha uzun dersler
  };
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
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

  return (
    <div className="program-list-container">
      <div className="program-header">
        <div className="navigation-breadcrumb">
          <Link to="/faculties" className="breadcrumb-link">Faculties</Link> &gt; 
          <Link to={`/faculties/${facultyId}`} className="breadcrumb-link">{faculty.name}</Link> &gt; 
          <span className="current-page">{department.name}</span>
        </div>
        
        <h1>{department.name}</h1>
        <p className="program-subtitle">Programs and courses organized by academic year</p>
        
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
          <button 
            className={`view-btn ${viewMode === 'schedule' ? 'active' : ''}`} 
            onClick={() => setViewMode('schedule')}
          >
            Schedule View
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading programs...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="level-sections">
          {LEVELS.map(level => {
            const levelCourses = coursesByLevel[level.id] || [];
            const levelSchedule = scheduleByLevel[level.id];
            
            // Bu seviyede hiçbir kurs yoksa, gösterme
            if (levelCourses.length === 0) return null;
            
            return (
              <div className="level-section" key={level.id}>
                <h2 className="level-title">
                  <span className="level-icon">{level.icon}</span>
                  {level.name}
                </h2>
                
                {viewMode === 'list' ? (
                  <table className="program-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Type</th>
                        <th>ECTS</th>
                        <th>Hours</th>
                        <th>Students</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelCourses.map(course => (
                        <tr key={course.id} className={course.is_active ? 'active-course' : 'inactive-course'}>
                          <td className="course-code">{course.code}</td>
                          <td>{course.name}</td>
                          <td>{course.type}</td>
                          <td className="text-center">{course.ects}</td>
                          <td className="text-center">{course.total_hours}</td>
                          <td className="text-center">{course.student_count || 0}</td>
                          <td>
                            <Link to={`/courses/edit/${course.id}`} className="view-course-btn">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <>
                    {levelSchedule.hasSchedules ? (
                      <div className="weekly-schedule">
                        <table className="schedule-table">
                          <thead>
                            <tr>
                              <th className="time-header">Time / Day</th>
                              {days.map(day => (
                                <th key={day} className="day-header">{day}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map(slot => (
                              <tr key={slot} className="time-slot">
                                <td className="time-cell">{slot}</td>
                                {days.map(day => renderScheduleCell(day, slot, levelSchedule))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="no-schedule">No schedule has been generated for this level yet.</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
          
          {Object.values(coursesByLevel).every(courses => courses.length === 0) && (
            <div className="no-programs">
              <p>No programs found for this department.</p>
              <Link to="/courses/new" className="add-course-link">Add New Course</Link>
            </div>
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
