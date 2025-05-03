import React, { useState, useEffect } from "react";
import { getSchedules } from "../api";
import "../styles/ScheduleList.css";

const ScheduleList = ({ token }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules(token);
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

  if (loading) return <div className="loading">Loading schedules...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="schedule-list-container">
      <h1>Class Schedules</h1>
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Course</th>
            <th>Classroom</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length === 0 ? (
            <tr>
              <td colSpan="4" className="no-data">No schedules found</td>
            </tr>
          ) : (
            schedules.map(schedule => (
              <tr key={schedule.id}>
                <td>{schedule.day}</td>
                <td>{schedule.time_range}</td>
                <td>{schedule.course ? schedule.course.name : "N/A"}</td>
                <td>{schedule.classroom ? schedule.classroom.name : "N/A"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleList;
