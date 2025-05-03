import React, { useEffect, useState } from "react";
import { getSchedules } from "../api";

const Schedules = ({ token }) => {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules(token);
        setSchedules(data);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      }
    };
    fetchSchedules();
  }, [token]);

  return (
    <div>
      <h2>Schedules</h2>
      <ul>
        {schedules.map((schedule) => (
          <li key={schedule.id}>
            {schedule.day} - {schedule.time_range}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Schedules;
