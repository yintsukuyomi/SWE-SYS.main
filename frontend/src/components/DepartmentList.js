import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/ListView.css';
import '../styles/CourseList.css';
import '../styles/SearchStyles.css';

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
      <div className="list-container">
        <div className="error-message">Fakülte bulunamadı</div>
        <Link to="/faculties" className="back-button">Fakültelere Dön</Link>
      </div>
    );
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <div className="header-content">
          <h1>{faculty.name}</h1>
          <p className="list-subtitle">Bölümler ve programları</p>
        </div>
        <div className="header-actions">
          <Link to="/faculties" className="back-button">
            ← Fakültelere Dön
          </Link>
        </div>
      </div>
      
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
      
      <div className="department-list">
        <table className="list-table">
          <thead>
            <tr>
              <th>Bölüm Adı</th>
              <th className="text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map(department => (
                <tr key={department.id}>
                  <td>{department.name}</td>
                  <td className="text-center">
                    <Link
                      className="view-details-btn"
                      to={`/faculties/${facultyId}/departments/${department.id}`}
                    >
                      Detayları Gör
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="no-data-message">
                  Bu fakülte için bölüm bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentList;
