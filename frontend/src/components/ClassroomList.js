import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClassrooms, deleteClassroom } from "../api";
import "../styles/ClassroomList.css";
import { FACULTIES } from '../constants/facultiesAndDepartments';

const ClassroomList = ({ token, user }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    classroomId: null,
    classroomName: ''
  });
  const [groupedClassrooms, setGroupedClassrooms] = useState({});
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, [token]);

  const fetchClassrooms = async () => {
    try {
      const data = await getClassrooms(token);
      setClassrooms(data);

      // Fakülte ve bölümlere göre gruplayarak organize edelim
      const grouped = {};
      const faculties = new Set();

      data.forEach(classroom => {
        // Fakülteyi kaydedelim
        faculties.add(classroom.faculty);

        // Fakülte bazında grupla
        if (!grouped[classroom.faculty]) {
          grouped[classroom.faculty] = {};
        }

        // Bölüm bazında grupla
        if (!grouped[classroom.faculty][classroom.department]) {
          grouped[classroom.faculty][classroom.department] = [];
        }

        // Sınıfı ilgili fakülte ve bölüme ekle
        grouped[classroom.faculty][classroom.department].push(classroom);
      });

      setGroupedClassrooms(grouped);
      setFacultyList([...faculties].sort());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setError("Failed to load classrooms");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({
      show: true,
      classroomId: id,
      classroomName: name
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      classroomId: null,
      classroomName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteClassroom(deleteConfirm.classroomId, token);
      setDeleteConfirm({
        show: false,
        classroomId: null,
        classroomName: ''
      });
      // Derslik listesini yeniden yükle
      fetchClassrooms();
    } catch (error) {
      console.error("Error deleting classroom:", error);
      setError("Failed to delete classroom. " + (error.detail || ""));
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

  // Derslikleri arama fonksiyonu
  const filteredClassrooms = (classroomList) => {
    if (!searchTerm) return classroomList;
    
    return classroomList.filter(classroom => 
      classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classroom.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Fakülteleri arama fonksiyonu
  const filteredFaculties = () => {
    if (!searchTerm) return facultyList;
    
    return facultyList.filter(faculty => 
      faculty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Bölümleri arama fonksiyonu
  const filteredDepartments = (departments) => {
    if (!searchTerm) return departments;
    
    return departments.filter(department => 
      department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Fakülteler sayfası
  const renderFacultiesPage = () => {
    return (
      <div className="faculties-page">
        <h1 className="page-title">Fakülteler ve Binalar</h1>
        <p className="page-description">Derslikleri fakülte ve bölüme göre inceleyin</p>
        
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
                <th>Derslik Sayısı</th>
                <th>Toplam Kapasite</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
                // Her fakültedeki toplam sınıf sayısını ve kapasiteyi hesapla
                let totalClassrooms = 0;
                let totalCapacity = 0;
                let departmentCount = 0;
                
                if (groupedClassrooms[faculty]) {
                  departmentCount = Object.keys(groupedClassrooms[faculty]).length;
                  
                  Object.values(groupedClassrooms[faculty]).forEach(classrooms => {
                    totalClassrooms += classrooms.length;
                    classrooms.forEach(classroom => {
                      totalCapacity += classroom.capacity || 0;
                    });
                  });
                }
                
                return (
                  <tr key={faculty}>
                    <td>{faculty}</td>
                    <td>{departmentCount}</td>
                    <td>{totalClassrooms}</td>
                    <td>{totalCapacity}</td>
                    <td>
                      <button 
                        className="view-details-btn"
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
    if (!selectedFaculty || !groupedClassrooms[selectedFaculty]) {
      return <div>Bölüm bulunamadı</div>;
    }
    
    const departments = Object.keys(groupedClassrooms[selectedFaculty]);
    
    return (
      <div className="departments-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Fakültelere Dön
          </button>
        </div>
        
        <h1 className="page-title">{selectedFaculty}</h1>
        <p className="page-description">Bölümler ve derslikleri</p>
        
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
                <th>Derslik Sayısı</th>
                <th>Toplam Kapasite</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments(departments).map(department => {
                const classrooms = groupedClassrooms[selectedFaculty][department];
                let totalCapacity = 0;
                
                classrooms.forEach(classroom => {
                  totalCapacity += classroom.capacity || 0;
                });
                
                return (
                  <tr key={department}>
                    <td>{department}</td>
                    <td>{classrooms.length}</td>
                    <td>{totalCapacity}</td>
                    <td>
                      <button 
                        className="view-details-btn"
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

  // Sınıflar sayfası
  const renderClassroomsPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedClassrooms[selectedFaculty] || 
        !groupedClassrooms[selectedFaculty][selectedDepartment]) {
      return <div>Derslik bulunamadı</div>;
    }
    
    const classrooms = groupedClassrooms[selectedFaculty][selectedDepartment];
    
    return (
      <div className="classrooms-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Fakültelere Dön
          </button>
          <button className="back-button" onClick={handleBackToDepartments}>
            ← Bölümlere Dön
          </button>
        </div>
        
        <div className="classroom-header">
          <div>
            <h1 className="page-title">{selectedDepartment}</h1>
            <p className="page-description">{selectedFaculty}</p>
          </div>
          
          {isAdmin && (
            <Link to="/classrooms/new" className="add-button">
              <span className="btn-icon">+</span> Yeni Derslik Ekle
            </Link>
          )}
        </div>
        
        <div className="search-container with-search-icon">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Derslik ara..."
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
        
        <div className="classroom-list">
          <table className="list-table">
            <thead>
              <tr>
                <th>Derslik Adı</th>
                <th>Tür</th>
                <th>Kapasite</th>
                {isAdmin && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClassrooms(classrooms).map(classroom => (
                <tr key={classroom.id}>
                  <td>{classroom.name}</td>
                  <td>{classroom.type}</td>
                  <td>{classroom.capacity}</td>
                  {isAdmin && (
                    <td className="action-buttons">
                      <Link to={`/classrooms/edit/${classroom.id}`} className="btn-edit">Düzenle</Link>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteClick(classroom.id, classroom.name)}
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
      return <div className="loading">Derslikler yükleniyor...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (classrooms.length === 0) {
      return (
        <div className="empty-state">
          <div className="no-data-message">Hiç derslik bulunamadı.</div>
          {isAdmin && (
            <div className="empty-state-action">
              <Link to="/classrooms/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Derslik Ekle
              </Link>
            </div>
          )}
        </div>
      );
    }
    
    if (selectedFaculty && selectedDepartment) {
      return renderClassroomsPage();
    }
    
    if (selectedFaculty) {
      return renderDepartmentsPage();
    }
    
    return renderFacultiesPage();
  };

  return (
    <div className="classrooms-container">
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Silme Onayı</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>{deleteConfirm.classroomName}</strong> adlı dersliği silmek istediğinizden emin misiniz?</p>
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

export default ClassroomList;
