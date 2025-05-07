import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTeachers, deleteTeacher } from "../api";
import "../styles/TeacherList.css";
import "../styles/SearchStyles.css";
import { FACULTIES } from '../constants/facultiesAndDepartments';

const TeacherList = ({ token, user }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    teacherId: null,
    teacherName: '',
  });
  const [groupedTeachers, setGroupedTeachers] = useState({});
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, [token]);

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers(token);
      setTeachers(data);
      // Use Map for grouping for better performance
      const grouped = new Map();
      const faculties = new Set();
      data.forEach(teacher => {
        faculties.add(teacher.faculty);
        if (!grouped.has(teacher.faculty)) {
          grouped.set(teacher.faculty, new Map());
        }
        const deptMap = grouped.get(teacher.faculty);
        if (!deptMap.has(teacher.department)) {
          deptMap.set(teacher.department, []);
        }
        deptMap.get(teacher.department).push(teacher);
      });
      // Convert Map back to plain object for compatibility
      const groupedObj = {};
      grouped.forEach((deptMap, faculty) => {
        groupedObj[faculty] = {};
        deptMap.forEach((teachers, dept) => {
          groupedObj[faculty][dept] = teachers;
        });
      });
      setGroupedTeachers(groupedObj);
      setFacultyList([...faculties].sort());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to load teachers");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({
      show: true,
      teacherId: id,
      teacherName: name
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      teacherId: null,
      teacherName: '',
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteTeacher(deleteConfirm.teacherId, token);
      setDeleteConfirm({
        show: false,
        teacherId: null,
        teacherName: '',
      });
      // Öğretmen listesini yeniden yükle
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setError("Failed to delete teacher. " + (error.detail || ""));
    }
  };

  // Kullanıcının admin yetkisi olup olmadığını kontrol et
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("admin");

  // Fakülte seçme fonksiyonu
  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment(null);
  };

  // Bölüm seçme fonksiyonu
  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
  };

  // Ana sayfaya dönme fonksiyonu
  const handleBackToFaculties = () => {
    setSelectedFaculty(null);
    setSelectedDepartment(null);
  };

  // Üst düzey bölüm listesine dönüş
  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
  };

  // Fakülteleri arama fonksiyonu
  const filteredFaculties = () => {
    // Only filter on faculties page
    if (!searchTerm || selectedFaculty || selectedDepartment) return facultyList.slice().sort((a, b) => a.localeCompare(b));
    return facultyList
      .filter(faculty => faculty.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  };

  // Bölümleri arama fonksiyonu
  const filteredDepartments = (departments) => {
    // Only filter on departments page
    if (!searchTerm || selectedDepartment)
      return departments.slice().sort((a, b) => a.localeCompare(b));
    return departments
      .filter(department => department.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  };

  // Öğretmenleri arama fonksiyonu
  const filteredTeachers = (teacherList) => {
    // Only filter on teachers page
    let filtered = teacherList;
    if (searchTerm && selectedDepartment) {
      filtered = teacherList.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.working_days.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort teachers alphabetically by name
    return filtered.slice().sort((a, b) => a.name.localeCompare(b.name));
  };

  // Fakülteler sayfası
  const renderFacultiesPage = () => {
    return (
      <div className="faculties-page">
        <h1 className="page-title">Fakülteler ve Bölümler</h1>
        <p className="page-description">Öğretmenleri fakülte ve bölüme göre inceleyin</p>
        
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
                <th>Bölüm Sayısı</th>
                <th>Öğretmen Sayısı</th>
                <th style={{ width: 160, textAlign: "center" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
                // Her fakültedeki toplam öğretmen ve bölüm sayısını hesapla
                let totalTeachers = 0;
                let departmentCount = 0;
                if (groupedTeachers[faculty]) {
                  departmentCount = Object.keys(groupedTeachers[faculty]).length;
                  Object.values(groupedTeachers[faculty]).forEach(teachers => {
                    totalTeachers += teachers.length;
                  });
                }
                return (
                  <tr key={faculty}>
                    <td>{faculty}</td>
                    <td>{departmentCount}</td>
                    <td>{totalTeachers}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="view-details-btn"
                        style={{ minWidth: 120, display: "inline-block", textAlign: "center" }}
                        onClick={() => handleFacultySelect(faculty)}
                      >
                        Detayları Gör
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Bölümler sayfası
  const renderDepartmentsPage = () => {
    if (!selectedFaculty || !groupedTeachers[selectedFaculty]) {
      return <div>Bölüm bulunamadı</div>;
    }
    
    const departments = Object.keys(groupedTeachers[selectedFaculty]);
    
    return (
      <div className="departments-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Fakültelere Dön
          </button>
        </div>
        
        <h1 className="page-title">{selectedFaculty}</h1>
        <p className="page-description">Bölümler ve öğretmenleri</p>
        
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
                <th>Öğretmen Sayısı</th>
                <th style={{ width: 160, textAlign: "center" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments(departments).map(department => {
                const teachers = groupedTeachers[selectedFaculty][department];
                return (
                  <tr key={department}>
                    <td>{department}</td>
                    <td>{teachers.length}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="view-details-btn"
                        style={{ minWidth: 120, display: "inline-block", textAlign: "center" }}
                        onClick={() => handleDepartmentSelect(department)}
                      >
                        Detayları Gör
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Öğretmenler sayfası
  const renderTeachersPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedTeachers[selectedFaculty] || 
        !groupedTeachers[selectedFaculty][selectedDepartment]) {
      return <div>Öğretmen bulunamadı</div>;
    }
    
    const departmentTeachers = groupedTeachers[selectedFaculty][selectedDepartment];
    
    return (
      <div className="teachers-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Fakültelere Dön
          </button>
          <button className="back-button" onClick={handleBackToDepartments}>
            ← Bölümlere Dön
          </button>
        </div>
        
        <div className="teacher-header">
          <div>
            <h1 className="page-title">{selectedDepartment}</h1>
            <p className="page-description">{selectedFaculty}</p>
          </div>
          
          {isAdmin && (
            <Link to="/teachers/new" className="add-button">
              <span className="btn-icon">+</span> Yeni Öğretmen Ekle
            </Link>
          )}
        </div>
        
        <div className="search-container with-search-icon">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Öğretmen ara..."
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
        
        <div className="teacher-list">
          <table className="list-table">
            <thead>
              <tr>
                <th>İsim</th>
                <th>Email</th>
                <th>Çalışma Günleri</th>
                <th>Çalışma Saatleri</th>
                {isAdmin && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTeachers(departmentTeachers).map(teacher => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.working_days}</td>
                  <td>{teacher.working_hours}</td>
                  {isAdmin && (
                    <td className="action-buttons">
                      <Link to={`/teachers/edit/${teacher.id}`} className="btn-edit">Düzenle</Link>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteClick(teacher.id, teacher.name)}
                      >
                        Sil
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Hangi sayfayı göstereceğimize karar ver
  const renderContent = () => {
    if (loading) {
      return <div className="loading">Öğretmenler yükleniyor...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (teachers.length === 0) {
      return (
        <div className="empty-state">
          <div className="no-data-message">Hiç öğretmen bulunamadı.</div>
          {isAdmin && (
            <div className="empty-state-action">
              <Link to="/teachers/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Öğretmen Ekle
              </Link>
            </div>
          )}
        </div>
      );
    }
    
    if (selectedFaculty && selectedDepartment) {
      return renderTeachersPage();
    }
    
    if (selectedFaculty) {
      return renderDepartmentsPage();
    }
    
    return renderFacultiesPage();
  };

  return (
    <div className="teachers-container">
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Silme Onayı</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>{deleteConfirm.teacherName}</strong> adlı öğretmeni silmek istediğinizden emin misiniz?</p>
              <p className="warning-text">Bu işlem geri alınamaz.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDelete} className="btn-cancel">İptal</button>
              <button onClick={confirmDelete} className="btn-delete">Sil</button>
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default TeacherList;
