import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/DepartmentList.css';

const DepartmentList = () => {
  const { facultyId } = useParams();
  const faculty = FACULTIES.find(f => f.id === facultyId);
  const departments = getDepartmentsByFaculty(facultyId);

  if (!faculty) {
    return (
      <div className="department-list-container">
        <div className="error-message">Faculty not found</div>
        <Link to="/faculties" className="back-link">Back to Faculties</Link>
      </div>
    );
  }

  return (
    <div className="department-list-container">
      <div className="department-header">
        <Link to="/faculties" className="back-link">← Back to Faculties</Link>
        <h1>{faculty.name}</h1>
        <p className="department-subtitle">Select a department to view its programs</p>
      </div>
      
      <div className="department-grid">
        {departments.length > 0 ? (
          departments.map(department => (
            <Link 
              to={`/faculties/${facultyId}/departments/${department.id}`} 
              key={department.id} 
              className="department-card"
            >
              <div className="department-icon">📚</div>
              <h3>{department.name}</h3>
              <div className="department-arrow">→</div>
            </Link>
          ))
        ) : (
          <div className="no-departments">No departments found for this faculty</div>
        )}
      </div>
    </div>
  );
};

export default DepartmentList;
