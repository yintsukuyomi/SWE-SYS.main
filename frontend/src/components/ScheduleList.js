import React, { useState, useEffect } from "react";
import { getSchedules, deleteSchedulesByDay, deleteSchedulesByDays, deleteSchedule } from "../api";
import "../styles/ScheduleList.css";
import "../styles/ListView.css";
import "../styles/CourseList.css";
import { toast } from 'react-toastify';

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
  const [deleteSingleConfirm, setDeleteSingleConfirm] = useState({
    show: false,
    scheduleId: null,
    info: null
  });

  // Türkçe gün isimleri eşlemesi
  const dayNameTr = {
    "Monday": "Pazartesi",
    "Tuesday": "Salı",
    "Wednesday": "Çarşamba",
    "Thursday": "Perşembe",
    "Friday": "Cuma",
    "Saturday": "Cumartesi",
    "Sunday": "Pazar"
  };

  // Türkçe -> İngilizce gün isimleri eşlemesi
  const trToEnDay = {
    "Pazartesi": "Monday",
    "Salı": "Tuesday",
    "Çarşamba": "Wednesday",
    "Perşembe": "Thursday",
    "Cuma": "Friday",
    "Cumartesi": "Saturday",
    "Pazar": "Sunday"
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

  // fetchSchedules fonksiyonunu component fonksiyonunun başında tanımla
  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedules(token);
      // Günlere göre gruplama
      const grouped = {};
      data.forEach(schedule => {
        const day = schedule.day;
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(schedule);
      });
      const sorted = Object.keys(grouped).sort((a, b) => (dayOrder[a] || 99) - (dayOrder[b] || 99));
      setGroupedSchedules(grouped);
      setSortedDays(sorted);
      setSchedules(data);
    } catch (error) {
      setError("Ders programı yüklenirken bir hata oluştu.");
      toast.error("Ders programı yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      dayNames: [dayName]
    });
  };

  const handleDeleteMultipleDaysClick = (days) => {
    setDeleteConfirm({
      show: true,
      days: Array.isArray(days) ? days : [days],
      dayNames: Array.isArray(days) ? days : [days]
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
    setLoading(true);
    try {
      await deleteSchedulesByDays(deleteConfirm.days, token);
      toast.success("Gün(ler) başarıyla silindi.");
      setDeleteConfirm({ show: false, days: [], dayNames: [] });
      fetchSchedules();
    } catch (error) {
      setError(error.detail || "Gün(ler) silinemedi.");
      toast.error(error.detail || "Gün(ler) silinemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScheduleClick = (schedule) => {
    setDeleteSingleConfirm({
      show: true,
      scheduleId: schedule.id,
      info: `${schedule.day} - ${schedule.time_range} - ${schedule.course?.name || ''}`
    });
  };

  const cancelDeleteSingle = () => {
    setDeleteSingleConfirm({
      show: false,
      scheduleId: null,
      info: null
    });
  };

  const confirmDeleteSingle = async () => {
    setLoading(true);
    try {
      await deleteSchedule(deleteSingleConfirm.scheduleId, token);
      toast.success("Ders başarıyla silindi.");
      setDeleteSingleConfirm({ show: false, scheduleId: null, info: null });
      fetchSchedules();
    } catch (error) {
      setError(error.detail || "Ders silinemedi.");
      toast.error(error.detail || "Ders silinemedi.");
    } finally {
      setLoading(false);
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

  return (
    <div className="list-container">
      <div className="list-header">
        <div className="header-content">
          <h1>Ders Programı</h1>
          <p className="list-subtitle">Günlere göre program görüntüleme</p>
        </div>
      </div>

      {isAdmin && sortedDays.length > 0 && (
        <div className="admin-actions">
          <button 
            className="delete-multiple-days-btn"
            onClick={() => handleDeleteMultipleDaysClick(sortedDays)}
          >
            Tüm Günleri Sil
          </button>
        </div>
      )}
      
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Silme Onayı</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              {deleteConfirm.days.length === 1 ? (
                <p><strong>{deleteConfirm.dayNames[0]}</strong> gününe ait tüm programları silmek istediğinizden emin misiniz?</p>
              ) : (
                <p><strong>{deleteConfirm.dayNames.length}</strong> güne ait tüm programları silmek istediğinizden emin misiniz?</p>
              )}
              <p className="warning-text">Bu işlem geri alınamaz.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDelete} className="btn-cancel">İptal</button>
              <button onClick={confirmDelete} className="btn-delete">Sil</button>
            </div>
          </div>
        </div>
      )}
      
      {deleteSingleConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Program Silme Onayı</h3>
              <button className="close-button" onClick={cancelDeleteSingle}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>{deleteSingleConfirm.info}</strong> programını silmek istediğinizden emin misiniz?</p>
              <p className="warning-text">Bu işlem geri alınamaz.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDeleteSingle} className="btn-cancel">İptal</button>
              <button onClick={confirmDeleteSingle} className="btn-delete">Sil</button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Programlar yükleniyor...</div>
      ) : error ? (
        <div className="error-message">
          {typeof error === 'string'
            ? error
            : error.detail || error.msg || JSON.stringify(error)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="no-data-message">
          <p>Ders programı bulunamadı. Lütfen program oluşturmak için Program Oluşturucu kullanın.</p>
        </div>
      ) : (
        <div className="schedule-by-day">
          {sortedDays.map(day => (
            <div className="day-schedule" key={day}>
              <div className="day-header">
                <h2>{dayNameTr[day] || day}</h2>
              </div>
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Teacher</th>
                    <th>Classroom</th>
                    <th>Students / Capacity</th>
                    {isAdmin && <th>Actions</th>}
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
                          {isAdmin && (
                            <td className="actions-cell">
                              <button className="btn-delete" onClick={() => handleDeleteScheduleClick(schedule)}>
                                Sil
                              </button>
                            </td>
                          )}
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
