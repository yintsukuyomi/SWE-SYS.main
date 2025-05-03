import React, { useState, useEffect } from "react";
import { getSchedules } from "../api";
import "../styles/ScheduleList.css";

const ScheduleList = ({ token }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [sortedDays, setSortedDays] = useState([]);

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
        console.log("Fetched schedules:", data);  // Debug logging
        
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
        setLoading(false);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setError("Failed to load schedules");
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [token]);

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
      <h1>Class Schedules</h1>
      
      {schedules.length === 0 ? (
        <div className="no-schedules">
          <p>No schedules found. Please use the Scheduler to generate a schedule.</p>
        </div>
      ) : (
        <div className="schedule-by-day">
          {sortedDays.map(day => (
            <div className="day-schedule" key={day}>
              <h2>{day}</h2>
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
                  {groupedSchedules[day]
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
                      
                      return (
                        <tr key={schedule.id} className={rowSpan > 1 ? "long-course" : ""}>
                          <td className="time-cell">{formatTimeRange(schedule.time_range, schedule.course)}</td>
                          <td>
                            <div className="course-info">
                              <div className="course-title">{schedule.course ? schedule.course.name : 'Unknown Course'}</div>
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
