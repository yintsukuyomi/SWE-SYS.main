import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/DepartmentList.css';

const DepartmentList = () => {
  const { facultyId } = useParams();
  const faculty = FACULTIES.find(f => f.id === facultyId);
  const departments = getDepartmentsByFaculty(facultyId) || [];
  const [searchTerm, setSearchTerm] = useState('');

  // Alfabetik ve arama filtreli bölümler
  const filteredDepartments = departments
    .filter(dep =>
      dep.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

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
      <div className="page-navigation">
        <Link to="/faculties" className="back-link">
          ← Fakültelere Dön
        </Link>
      </div>
      
      <h1>{faculty.name}</h1>
      <p className="subtitle">Bölümler ve programları</p>
      
      <div className="search-container with-search-icon">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Bölüm ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search-btn" 
            onClick={() => setSearchTerm('')}
            title="Aramayı Temizle"
          >
            ×
          </button>
        )}
      </div>
      
      <table className="list-table">
        <thead>
          <tr>
            <th>Bölüm Adı</th>
            <th style={{ width: 160, textAlign: "center" }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map(department => (
              <tr key={department.id}>
                <td>{department.name}</td>
                <td style={{ textAlign: "center" }}>
                  <Link
                    className="view-details-btn"
                    style={{ minWidth: 120, display: "inline-block", textAlign: "center" }}
                    to={`/faculties/${facultyId}/departments/${department.id}`}
                  >
                    Detayları Gör
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="no-data-message" style={{ textAlign: "center" }}>
                No departments found for this faculty
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentList;
