import React, { useState, useEffect } from 'react';
import { generateSchedule, getScheduleStatus, getSchedules } from '../api';
import '../styles/Scheduler.css';

const Scheduler = ({ token }) => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);
  
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
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError(err.detail || 'Failed to generate schedule. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  // Group schedules by day for better display
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) {
      acc[schedule.day] = [];
    }
    acc[schedule.day].push(schedule);
    return acc;
  }, {});
  
  // Sort days for consistent display
  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => {
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
    return dayOrder[a] - dayOrder[b];
  });
  
  const getCapacityStatusClass = (capacityRatio) => {
    if (capacityRatio > 90) return 'capacity-critical';
    if (capacityRatio > 75) return 'capacity-high';
    if (capacityRatio > 50) return 'capacity-medium';
    return 'capacity-good';
  };
  
  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h1>Automatic Scheduler</h1>
        <p className="scheduler-description">
          This tool automatically generates an optimized schedule for all courses based on teacher availability, 
          classroom suitability, and course requirements.
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="scheduler-actions">
        <div className="scheduler-status">
          {status && (
            <>
              <h3>Current Schedule Status</h3>
              <div className="status-details">
                <div className="status-item">
                  <span className="status-label">Active Courses:</span>
                  <span className="status-value">{status.total_active_courses}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Scheduled:</span>
                  <span className="status-value">{status.scheduled_courses}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Completion:</span>
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
            {generating ? 'Generating...' : 'Generate New Schedule'}
          </button>
          <p className="warning-text">Warning: This will replace the current schedule!</p>
        </div>
      </div>
      
      {result && (
        <div className="scheduler-result">
          <h3>Generation Results</h3>
          <div className="result-summary">
            <div className="result-item">
              <span className="result-label">Successfully Scheduled:</span>
              <span className="result-value">{result.scheduled_count} courses</span>
            </div>
            <div className="result-item">
              <span className="result-label">Failed to Schedule:</span>
              <span className="result-value">{result.unscheduled_count} courses</span>
            </div>
            <div className="result-item">
              <span className="result-label">Success Rate:</span>
              <span className="result-value">{result.success_rate}%</span>
            </div>
          </div>
          
          {result.unscheduled_count > 0 && (
            <div className="unscheduled-list">
              <h4>Courses that could not be scheduled:</h4>
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Students</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.unscheduled.map(course => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>{course.code}</td>
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
        <h3>Current Schedule</h3>
        {schedules.length === 0 ? (
          <p className="no-schedule">No schedule has been generated yet.</p>
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
