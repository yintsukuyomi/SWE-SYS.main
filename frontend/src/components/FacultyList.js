import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FACULTIES } from '../constants/facultiesAndDepartments';
import '../styles/FacultyList.css';

const FacultyList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fakülteleri arama fonksiyonu
  const filteredFaculties = () => {
    if (!searchTerm) return FACULTIES;
    
    return FACULTIES.filter(faculty => 
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  return (
    <div className="faculty-list-container">
      <h1>Fakülteler</h1>
      <p className="subtitle">Fakülteler ve bölümlerini görüntüleyin</p>
      
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
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculties().map(faculty => (
              <tr key={faculty.id}>
                <td>{faculty.name}</td>
                <td>{faculty.departments ? faculty.departments.length : 0} bölüm</td>
                <td>
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
