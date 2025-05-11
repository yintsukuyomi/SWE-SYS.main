import React, { useState, useEffect } from 'react';
import { generateSchedule, getScheduleStatus, getSchedules, getCourses } from '../api';
import '../styles/Scheduler.css';

const Scheduler = ({ token }) => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);
  const [unscheduledCourses, setUnscheduledCourses] = useState([]);
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [sortedDays, setSortedDays] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    // Fetch current schedule status when component loads
    fetchStatus();
    fetchExistingSchedules();
  }, [token]);
  
  const fetchStatus = async () => {
    try {
      const statusData = await getScheduleStatus(token);
      setStatus(statusData);
    } catch (err) {
      console.error('Error fetching schedule status:', err);
      setError(err.detail || 'Failed to fetch schedule status');
    }
  };
  
  const fetchExistingSchedules = async () => {
    try {
      const data = await getSchedules(token);
      setSchedules(data);
      
      // Group schedules by day for display
      const grouped = {};
      data.forEach(schedule => {
        if (!grouped[schedule.day]) {
          grouped[schedule.day] = [];
        }
        grouped[schedule.day].push(schedule);
      });
      
      // Sort days according to dayOrder
      const sorted = Object.keys(grouped).sort((a, b) => {
        return (dayOrder[a] || 99) - (dayOrder[b] || 99);
      });

      setGroupedSchedules(grouped);
      setSortedDays(sorted);
    } catch (err) {
      console.error('Error fetching existing schedules:', err);
      // Don't set error for this one as it's not critical
    }
  };
  
  const handleGenerateSchedule = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await generateSchedule(token);
      setResult(data);
      await fetchStatus();  // Update status after generation
      await fetchExistingSchedules();  // Refresh schedule list
      
      // Unscheduled kurslar için detaylı bilgi göster
      if (data.unscheduled && data.unscheduled.length > 0) {
        const twoHourCourses = data.unscheduled.filter(c => c.total_hours === 2);
        if (twoHourCourses.length > 0) {
          console.log("2 saatlik programlanamayan dersler:", twoHourCourses);
          setShowDetails(true);
        }
      }
    } catch (err) {
      console.error('Program oluşturulurken hata:', err);
      setError(err.detail || 'Program oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setGenerating(false);
    }
  };
  
  const dayOrder = {
    "Pazartesi": 1, 
    "Salı": 2, 
    "Çarşamba": 3, 
    "Perşembe": 4, 
    "Cuma": 5, 
    "Cumartesi": 6, 
    "Pazar": 7
  };
  
  const getCapacityStatusClass = (capacityRatio) => {
    if (capacityRatio > 90) return 'capacity-critical';
    if (capacityRatio > 75) return 'capacity-high';
    if (capacityRatio > 50) return 'capacity-medium';
    return 'capacity-good';
  };
  
  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h1>Otomatik Program Oluşturucu</h1>
        <p className="scheduler-description">
          Bu araç, öğretmen uygunluğu, derslik uygunluğu ve ders gereksinimleri temelinde 
          tüm dersler için otomatik olarak optimize edilmiş bir program oluşturur.
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="scheduler-actions">
        <div className="scheduler-status">
          {status && (
            <>
              <h3>Mevcut Program Durumu</h3>
              <div className="status-details">
                <div className="status-item">
                  <span className="status-label">Aktif Dersler:</span>
                  <span className="status-value">{status.total_active_courses}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Programlananlar:</span>
                  <span className="status-value">{status.scheduled_courses}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Tamamlanma:</span>
                  <span className="status-value">{status.completion_percentage}%</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="scheduler-generate">
          <button 
            onClick={handleGenerateSchedule} 
            disabled={generating}
            className="generate-btn"
          >
            {generating ? 'Oluşturuluyor...' : 'Yeni Program Oluştur'}
          </button>
          <p className="warning-text">Uyarı: Bu işlem mevcut programın yerini alacaktır!</p>
        </div>
      </div>
      
      {result && (
        <div className="scheduler-result">
          <h3>Oluşturma Sonuçları</h3>
          <div className="result-summary">
            <div className="result-item">
              <span className="result-label">Başarıyla Programlanan:</span>
              <span className="result-value">{result.scheduled_count} ders</span>
            </div>
            <div className="result-item">
              <span className="result-label">Programlanamayan:</span>
              <span className="result-value">{result.unscheduled_count} ders</span>
            </div>
            <div className="result-item">
              <span className="result-label">Başarı Oranı:</span>
              <span className="result-value">{result.success_rate}%</span>
            </div>
          </div>
          
          {result.unscheduled_count > 0 && (
            <div className="unscheduled-list">
              <h4>Programlanamayan dersler:</h4>
              <div className="scheduler-tip">
                <strong>İpucu:</strong> 2 saatlik programlanamayan dersler için:
                <ol>
                  <li>Öğretmen müsaitlik zamanlarının ders saatleri ile uyumlu olup olmadığını kontrol edin</li>
                  <li>Geçici olarak ders saatlerini 1.5 veya 3'e değiştirmeyi deneyin</li>
                  <li>Bu dersler için manuel program oluşturun</li>
                </ol>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ders</th>
                    <th>Kod</th>
                    <th>Saat</th>
                    <th>Öğrenci</th>
                    <th>Sebep</th>
                  </tr>
                </thead>
                <tbody>
                  {result.unscheduled.map(course => (
                    <tr key={course.id} className={course.total_hours === 2 ? 'highlight-row' : ''}>
                      <td>{course.name}</td>
                      <td>{course.code}</td>
                      <td>{course.total_hours}</td>
                      <td>{course.student_count}</td>
                      <td>{course.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="current-schedule">
        <h3>Mevcut Program</h3>
        {schedules.length === 0 ? (
          <p className="no-schedule">Henüz oluşturulmuş bir program yok.</p>
        ) : (
          <div className="schedule-by-day">
            {sortedDays.map(day => (
              <div className="day-schedule" key={day}>
                <h4>{day}</h4>
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Course</th>
                      <th>Classroom</th>
                      <th>Students / Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSchedules[day]
                      .sort((a, b) => {
                        const aTime = a.time_range.split('-')[0];
                        const bTime = b.time_range.split('-')[0];
                        return aTime.localeCompare(bTime);
                      })
                      .map(schedule => {
                        const studentCount = schedule.course ? schedule.course.student_count || 0 : 0;
                        const classroomCapacity = schedule.classroom ? schedule.classroom.capacity || 0 : 0;
                        const capacityRatio = classroomCapacity > 0 ? (studentCount / classroomCapacity) * 100 : 0;
                        const capacityClass = getCapacityStatusClass(capacityRatio);
                        
                        return (
                          <tr key={schedule.id}>
                            <td>{schedule.time_range}</td>
                            <td>{schedule.course ? `${schedule.course.name} (${schedule.course.code})` : 'Unknown Course'}</td>
                            <td>{schedule.classroom ? schedule.classroom.name : 'Unknown Classroom'}</td>
                            <td className={capacityClass}>
                              {studentCount} / {classroomCapacity}
                              {capacityRatio > 90 && <span className="capacity-warning"> ⚠️</span>}
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;
