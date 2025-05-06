import React from 'react';
import { Link } from 'react-router-dom';
import { FACULTIES } from '../constants/facultiesAndDepartments';
import '../styles/FacultyList.css';

const FacultyList = () => {
  return (
    <div className="faculty-list-container">
      <h1>Faculties</h1>
      <p className="faculty-subtitle">Select a faculty to view its departments and programs</p>
      
      <div className="faculty-grid">
        {FACULTIES.map(faculty => (
          <Link to={`/faculties/${faculty.id}`} key={faculty.id} className="faculty-card">
            <div className="faculty-icon">🏛️</div>
            <h3>{faculty.name}</h3>
            <div className="faculty-arrow">→</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FacultyList;
