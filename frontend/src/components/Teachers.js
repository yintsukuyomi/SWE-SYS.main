import React, { useEffect, useState } from "react";
import { getTeachers } from "../api";

const Teachers = ({ token }) => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await getTeachers(token);
        setTeachers(data);
      } catch (error) {
        console.error("Öğretmenler yüklenirken hata oluştu:", error);
      }
    };
    fetchTeachers();
  }, [token]);

  return (
    <div>
      <h2>Öğretmenler</h2>
      <ul>
        {teachers.map((teacher) => (
          <li key={teacher.id}>{teacher.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Teachers;
