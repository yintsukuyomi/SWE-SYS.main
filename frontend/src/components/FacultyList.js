import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FACULTIES, DEPARTMENTS } from '../constants/facultiesAndDepartments';
import '../styles/ListView.css';
import '../styles/CourseList.css';
import '../styles/SearchStyles.css';

const FacultyList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter and sort faculties alphabetically
  const filteredFaculties = () => {
    if (!searchTerm) {
      return FACULTIES.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }
    return FACULTIES
      .filter(faculty => faculty.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  };
  
  return (
    <div className="list-container">
      <div className="list-header">
        <div className="header-content">
          <h1>Fakülteler</h1>
          <p className="list-subtitle">Fakülte ve bölümlere göre görüntüleyin</p>
        </div>
      </div>
      
      <div className="search-container with-search-icon">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Fakülte ara..."
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
      
      <div className="faculty-list">
        <table className="list-table">
          <thead>
            <tr>
              <th>Fakülte Adı</th>
              <th>Bölümler</th>
              <th className="text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculties().map(faculty => (
              <tr key={faculty.id}>
                <td>{faculty.name}</td>
                <td>{DEPARTMENTS[faculty.id] ? DEPARTMENTS[faculty.id].length : 0} bölüm</td>
                <td className="text-center">
                  <Link to={`/faculties/${faculty.id}`} className="view-details-btn">
                    Detayları Gör
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacultyList;
