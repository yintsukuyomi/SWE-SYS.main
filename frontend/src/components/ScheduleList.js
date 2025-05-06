import React, { useState, useEffect } from "react";
import { getSchedules, deleteSchedulesByDay } from "../api";
import "../styles/ScheduleList.css";

const ScheduleList = ({ token, user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [sortedDays, setSortedDays] = useState([]);
  // Silme doğrulaması için state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    day: null,
    dayName: ''
  });

  // Tarih ve gün formatlamalarını yapacak yardımcı fonksiyonlar
  const formatDateForDisplay = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', options);
  };

  // Tarihler için sıralama fonksiyonu
  const sortDates = (dates) => {
    return dates.sort((a, b) => new Date(a) - new Date(b));
  };

  const dayOrder = {
    "Monday": 1, 
    "Tuesday": 2, 
    "Wednesday": 3, 
    "Thursday": 4, 
    "Friday": 5, 
    "Saturday": 6, 
    "Sunday": 7
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules(token);
        console.log("Fetched schedules:", data);
        
        // Group schedules by date (assuming a date field exists or we convert day to date)
        const grouped = {};
        
        // Simulating dates - in a real app, these would come from the backend
        const today = new Date();
        const dateMap = {
          "Monday": new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0],
          "Tuesday": new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
          "Wednesday": new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
          "Thursday": new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
          "Friday": new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0]
        };
        
        data.forEach(schedule => {
          // Convert day to a date format (example mapping)
          const scheduleDate = dateMap[schedule.day] || "2023-06-01"; // Default date if day not found
          
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
      day: dayName,
      dayName: formatDateForDisplay(date)
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      day: null,
      dayName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      // Günün tüm schedule'larını sil
      await deleteSchedulesByDay(deleteConfirm.day, token);
      setDeleteConfirm({
        show: false,
        day: null,
        dayName: ''
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

  if (loading) return <div className="loading">Loading schedules...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="schedule-list-container">
      <h1>Weekly Schedule</h1>
      
      {/* Silme onay modalı */}
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Delete Confirmation</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>ALL schedules</strong> for <strong>{deleteConfirm.dayName}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will remove all classes scheduled on this day.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDelete} className="btn-cancel">Cancel</button>
              <button onClick={confirmDelete} className="btn-delete">Delete All</button>
            </div>
          </div>
        </div>
      )}
      
      {schedules.length === 0 ? (
        <div className="no-schedules">
          <p>No schedules found. Please use the Scheduler to generate a schedule.</p>
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
                      const studentCount = schedule.course ? schedule.course.student_count || 0 : 0;
                      const classroomCapacity = schedule.classroom ? schedule.classroom.capacity || 0 : 0;
                      const capacityClass = getCapacityStatusClass(schedule);
                      const rowSpan = calculateRowspan(schedule.time_range);
                      const courseName = schedule.course ? schedule.course.name : 'Unknown Course';
                      
                      return (
                        <tr key={schedule.id} className={rowSpan > 1 ? "long-course" : ""}>
                          <td className="time-cell">{formatTimeRange(schedule.time_range, schedule.course)}</td>
                          <td>
                            <div className="course-info">
                              <div className="course-title">{courseName}</div>
                              <div className="course-code">{schedule.course ? schedule.course.code : ''}</div>
                            </div>
                          </td>
                          <td>{schedule.course && schedule.course.teacher ? schedule.course.teacher.name : 'Unknown Teacher'}</td>
                          <td>{schedule.classroom ? schedule.classroom.name : 'Unknown Classroom'}</td>
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
