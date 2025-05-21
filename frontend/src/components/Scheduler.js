import React, { useState, useEffect } from 'react';
import { generateSchedule, getScheduleStatus, getSchedules, getCourses } from '../api';
import '../styles/Scheduler.css';
import { toast } from 'react-toastify';

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
  const [lastMethod, setLastMethod] = useState('genetic'); // genetic
  
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
  
  const handleGenerateSchedule = async (method = 'genetic') => {
    setGenerating(true);
    setError(null);
    setResult(null);
    setLastMethod(method);
    try {
      const data = await generateSchedule(token, method);
      setResult(data);
      await fetchStatus();  // Update status after generation
      await fetchExistingSchedules();  // Refresh schedule list
      if (data.unscheduled && data.unscheduled.length > 0) {
        const twoHourCourses = data.unscheduled.filter(c => c.total_hours === 2);
        if (twoHourCourses.length > 0) {
          console.log("2 saatlik programlanamayan dersler:", twoHourCourses);
          setShowDetails(true);
        }
      }
    } catch (err) {
      let errorMessage = err.detail || err.message || 'Program oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      setError(errorMessage);
      toast.error(errorMessage);
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
  
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const TIME_SLOTS = [
    "08:00-08:30", "08:30-09:00", "09:00-09:30", "09:30-10:00",
    "10:00-10:30", "10:30-11:00", "11:00-11:30", "11:30-12:00",
    "12:00-12:30", "12:30-13:00", "13:00-13:30", "13:30-14:00",
    "14:00-14:30", "14:30-15:00", "15:00-15:30", "15:30-16:00",
    "16:00-16:30", "16:30-17:00"
  ];

  function getScheduleGrid(schedule) {
    const grid = {};
    for (const day of DAYS) {
      grid[day] = {};
      for (const slot of TIME_SLOTS) {
        grid[day][slot] = [];
      }
    }
    schedule.forEach(item => {
      const { day, time_range } = item;
      const [start, end] = time_range.split("-");
      const toMinutes = t => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const startMin = toMinutes(start);
      const endMin = toMinutes(end);
      TIME_SLOTS.forEach(slot => {
        const [slotStart, slotEnd] = slot.split("-");
        const slotStartMin = toMinutes(slotStart);
        const slotEndMin = toMinutes(slotEnd);
        if (slotStartMin >= startMin && slotEndMin <= endMin) {
          if (DAYS.includes(day)) {
            grid[day][slot].push(item);
          }
        }
      });
    });
    return grid;
  }

  function renderScheduleGrid(schedule) {
    const grid = getScheduleGrid(schedule);
    return (
      <div className="schedule-grid-wrapper">
        <table className="schedule-grid-table">
          <thead>
            <tr>
              <th></th>
              {DAYS.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot}>
                <td className="time-header">{slot}</td>
                {DAYS.map(day => {
                  const items = grid[day][slot];
                  return (
                    <td key={day + slot} className="schedule-cell">
                      {items.length === 0 ? (
                        <div className="empty-slot"></div>
                      ) : (
                        items.map((item, idx) => {
                          const cap = item.classroom?.capacity || 0;
                          const stu = item.course?.student_count || 0;
                          const isFull = cap > 0 && stu >= cap;
                          return (
                            <div
                              key={idx}
                              className={`lesson-box${isFull ? " full" : ""}`}
                              title={`${item.course?.name || ""} (${item.course?.code || ""})\n${item.classroom?.name || ""} | ${stu} / ${cap}`}
                            >
                              <div className="lesson-title">{item.course?.name} <span className="lesson-code">({item.course?.code})</span></div>
                              <div className="lesson-room">{item.classroom?.name}</div>
                              <div className="lesson-capacity">{stu} / {cap}</div>
                            </div>
                          );
                        })
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
            onClick={() => handleGenerateSchedule('genetic')}
            disabled={generating}
            className="generate-btn"
            style={{ background: '#6c63ff' }}
          >
            {generating ? 'Yapay Zeka Çalışıyor...' : 'Yapay Zeka ile Oluştur'}
          </button>
          <p className="warning-text">Uyarı: Bu işlem mevcut programın yerini alacaktır!</p>
        </div>
      </div>
      
      {result && (
        <div className="scheduler-result">
          <h3>Oluşturma Sonuçları</h3>
          <div className="result-summary">
            <div className="result-item">
              <span className="result-label">Kullanılan Algoritma:</span>
              <span className="result-value">
                Yapay Zeka (Genetik Algoritma)
                {result.perfect !== undefined && (
                  result.perfect ? ' (Kusursuz Çözüm)' : ' (Kusursuz Değil)'
                )}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Başarıyla Programlanan:</span>
              <span className="result-value">{Number(result.scheduled_count) || 0} ders</span>
            </div>
            <div className="result-item">
              <span className="result-label">Programlanamayan:</span>
              <span className="result-value">{Number(result.unscheduled_count) || 0} ders</span>
            </div>
            <div className="result-item">
              <span className="result-label">Başarı Oranı:</span>
              <span className="result-value">{Number(result.success_rate) || 0}%</span>
            </div>
          </div>
          
          {result.unscheduled_count > 0 && result.unscheduled && result.unscheduled.length > 0 ? (
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
                      <td>{course.name || 'Bilinmiyor'}</td>
                      <td>{course.code || '-'}</td>
                      <td>{course.total_hours || '-'}</td>
                      <td>{course.student_count || '-'}</td>
                      <td>{course.reason || 'Bilinmeyen neden'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : result.unscheduled_count === 0 ? (
            <div className="unscheduled-list">
              <h4>Tüm dersler başarıyla programlandı.</h4>
            </div>
          ) : null}
        </div>
      )}
      
      {result && result.schedule && result.schedule.length > 0 && (
        <div className="current-schedule">
          <h3>Mevcut Program</h3>
          {renderScheduleGrid(result.schedule)}
        </div>
      )}
    </div>
  );
};

export default Scheduler;
