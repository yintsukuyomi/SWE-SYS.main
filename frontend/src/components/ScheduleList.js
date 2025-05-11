import React, { useState, useEffect } from "react";
import { getSchedules, deleteSchedulesByDay, deleteSchedulesByDays } from "../api";
import "../styles/ScheduleList.css";

const ScheduleList = ({ token, user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [sortedDays, setSortedDays] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    days: [],
    dayNames: []
  });

  // Tarih ve gün formatlamalarını yapacak yardımcı fonksiyonlar
  const formatDateForDisplay = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', options);
  };

  // Tarihler için sıralama fonksiyonu
  const sortDates = (dates) => {
    return dates.sort((a, b) => new Date(a) - new Date(b));
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

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules(token);
        console.log("Fetched schedules:", data);
        
        // Group schedules by date
        const grouped = {};
        
        // Get the current week's dates
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const monday = new Date(today);
        monday.setDate(today.getDate() - currentDay + 1); // Move to Monday
        
        const dateMap = {
          "Monday": new Date(monday).toISOString().split('T')[0],
          "Tuesday": new Date(new Date(monday).setDate(monday.getDate() + 1)).toISOString().split('T')[0],
          "Wednesday": new Date(new Date(monday).setDate(monday.getDate() + 1)).toISOString().split('T')[0],
          "Thursday": new Date(new Date(monday).setDate(monday.getDate() + 1)).toISOString().split('T')[0],
          "Friday": new Date(new Date(monday).setDate(monday.getDate() + 1)).toISOString().split('T')[0]
        };
        
        data.forEach(schedule => {
          const scheduleDate = dateMap[schedule.day] || "2023-06-01";
          
          if (!grouped[scheduleDate]) {
            grouped[scheduleDate] = [];
          }
          grouped[scheduleDate].push(schedule);
        });
        
        // Sort dates
        const sorted = sortDates(Object.keys(grouped));

        setGroupedSchedules(grouped);
        setSortedDays(sorted);
        setSchedules(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setError("Failed to load schedules");
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [token]);

  // Admin kontrolü
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("admin");

  // Gün bazlı silme işlemi için fonksiyonlar
  const handleDeleteDayClick = (date) => {
    // Get day name from date for API
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    
    setDeleteConfirm({
      show: true,
      days: [dayName],
      dayNames: [formatDateForDisplay(date)]
    });
  };

  const handleDeleteMultipleDaysClick = (dates) => {
    const dayNames = dates.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'long' }));
    const formattedDates = dates.map(date => formatDateForDisplay(date));
    
    setDeleteConfirm({
      show: true,
      days: dayNames,
      dayNames: formattedDates
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      days: [],
      dayNames: []
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.days.length === 1) {
        // Single day deletion
        await deleteSchedulesByDay(deleteConfirm.days[0], token);
      } else {
        // Multiple days deletion
        await deleteSchedulesByDays(deleteConfirm.days, token);
      }
      
      setDeleteConfirm({
        show: false,
        days: [],
        dayNames: []
      });
      
      // Programları yeniden yükle
      const data = await getSchedules(token);
      
      // Group schedules by day
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
      setSchedules(data);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setError("Failed to delete schedule. " + (error.detail || ""));
    }
  };

  // Helper function to get color class based on student/capacity ratio
  const getCapacityStatusClass = (schedule) => {
    if (!schedule.classroom || !schedule.course) return '';
    
    const studentCount = schedule.course.student_count || 0;
    const classroomCapacity = schedule.classroom.capacity || 0;
    
    if (classroomCapacity === 0) return '';
    
    const capacityRatio = (studentCount / classroomCapacity) * 100;
    
    if (capacityRatio > 90) return 'capacity-critical';
    if (capacityRatio > 75) return 'capacity-high';
    if (capacityRatio > 50) return 'capacity-medium';
    return 'capacity-good';
  };

  // Helper function to calculate rowspan based on course duration
  const calculateRowspan = (timeRange) => {
    // Calculate hours in the time range
    const [start, end] = timeRange.split('-');
    
    // Parse hours and minutes
    const [startHour, startMin] = start.split(':').map(n => parseInt(n, 10));
    const [endHour, endMin] = end.split(':').map(n => parseInt(n, 10));
    
    // Convert to minutes
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate duration in hours
    const durationHours = (endMinutes - startMinutes) / 60;
    
    // Determine rowspan based on duration
    if (durationHours <= 1.5) return 1;  // 1.5 saatlik ders
    if (durationHours <= 2) return 2;    // 2 saatlik ders
    if (durationHours <= 3) return 2;    // 3 saatlik ders
    return 3;                           // Daha uzun dersler
  };

  // Format time range to show duration
  const formatTimeRange = (timeRange, course) => {
    // Calculate the duration from the time range
    const [start, end] = timeRange.split('-');
    const totalHours = course?.total_hours || 0;
    
    return (
      <div>
        <div className="time-display">{timeRange}</div>
        {totalHours > 0 && (
          <span className="time-duration">({totalHours} hours)</span>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Ders programı yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="schedule-list-container">
      <h1>Haftalık Ders Programı</h1>
      
      {isAdmin && sortedDays.length > 0 && (
        <div className="admin-actions">
          <button 
            className="delete-multiple-days-btn"
            onClick={() => handleDeleteMultipleDaysClick(sortedDays)}
          >
            Delete All Days
          </button>
        </div>
      )}
      
      {/* Silme onay modalı */}
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Silme Onayı</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>
                {deleteConfirm.dayNames.length === 1 ? (
                  <><strong>{deleteConfirm.dayNames[0]}</strong> günündeki <strong>TÜM dersleri</strong> silmek istediğinize emin misiniz?</>
                ) : (
                  <><strong>{deleteConfirm.dayNames.join(', ')}</strong> günlerindeki <strong>TÜM dersleri</strong> silmek istediğinize emin misiniz?</>
                )}
              </p>
              <p className="warning-text">Bu işlem geri alınamaz ve seçili günlere ait tüm programlanmış dersleri kaldıracaktır.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDelete} className="btn-cancel">İptal</button>
              <button onClick={confirmDelete} className="btn-delete">Tümünü Sil</button>
            </div>
          </div>
        </div>
      )}
      
      {schedules.length === 0 ? (
        <div className="no-schedules">
          <p>Ders programı bulunamadı. Lütfen program oluşturmak için Program Oluşturucu kullanın.</p>
        </div>
      ) : (
        <div className="schedule-by-day">
          {sortedDays.map(date => (
            <div className="day-schedule" key={date}>
              <div className="day-header">
                <h2>{formatDateForDisplay(date)}</h2>
                {isAdmin && (
                  <button 
                    className="delete-day-btn" 
                    onClick={() => handleDeleteDayClick(date)}
                  >
                    Delete All
                  </button>
                )}
              </div>
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Teacher</th>
                    <th>Classroom</th>
                    <th>Students / Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSchedules[date]
                    .sort((a, b) => {
                      const aTime = a.time_range.split('-')[0];
                      const bTime = b.time_range.split('-')[0];
                      return aTime.localeCompare(bTime);
                    })
                    .map(schedule => {
                      const studentCount = schedule.course?.student_count || 0;
                      const classroomCapacity = schedule.classroom?.capacity || 0;
                      const capacityClass = getCapacityStatusClass(schedule);
                      const rowSpan = calculateRowspan(schedule.time_range);
                      const courseName = schedule.course?.name || 'Unknown Course';
                      const teacherName = schedule.course?.teacher?.name || 'Unknown Teacher';
                      const classroomName = schedule.classroom?.name || 'Unknown Classroom';
                      
                      return (
                        <tr key={schedule.id} className={rowSpan > 1 ? "long-course" : ""}>
                          <td className="time-cell">{formatTimeRange(schedule.time_range, schedule.course)}</td>
                          <td>
                            <div className="course-info">
                              <div className="course-title">{courseName}</div>
                              <div className="course-code">{schedule.course?.code || ''}</div>
                            </div>
                          </td>
                          <td>{teacherName}</td>
                          <td>{classroomName}</td>
                          <td className={capacityClass}>
                            {studentCount} / {classroomCapacity}
                            {studentCount > classroomCapacity && <span className="capacity-warning"> ⚠️</span>}
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
  );
};

export default ScheduleList;
