import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClassrooms, deleteClassroom } from "../api";
import "../styles/ListView.css";
import "../styles/SearchStyles.css";
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

      // Use Map for grouping for better performance
      const grouped = new Map();
      const faculties = new Set();

      data.forEach(classroom => {
        faculties.add(classroom.faculty);
        if (!grouped.has(classroom.faculty)) {
          grouped.set(classroom.faculty, new Map());
        }
        const deptMap = grouped.get(classroom.faculty);
        if (!deptMap.has(classroom.department)) {
          deptMap.set(classroom.department, []);
        }
        deptMap.get(classroom.department).push(classroom);
      });

      // Convert Map back to plain object for compatibility
      const groupedObj = {};
      grouped.forEach((deptMap, faculty) => {
        groupedObj[faculty] = {};
        deptMap.forEach((classrooms, dept) => {
          groupedObj[faculty][dept] = classrooms;
        });
      });

      setGroupedClassrooms(groupedObj);
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
    // Only filter on classrooms page
    let filtered = classroomList;
    if (searchTerm && selectedDepartment) {
      filtered = classroomList.filter(classroom =>
        classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classroom.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort classrooms alphabetically by name
    return filtered.slice().sort((a, b) => a.name.localeCompare(b.name));
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

  // Fakülteler sayfası
  const renderFacultiesPage = () => {
    return (
      <div className="list-container">
        <div className="list-header">
          <h1>Derslikler</h1>
          <p className="list-subtitle">Fakülte ve bölümlere göre derslikleri görüntüleyin</p>
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
                <th>Bölüm Sayısı</th>
                <th>Derslik Sayısı</th>
                <th>Toplam Kapasite</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
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
                    <td className="text-center">
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
    const departments = Object.keys(groupedClassrooms[selectedFaculty] || {});
    
    return (
      <div className="list-container">
        <div className="list-header">
          <h1>{selectedFaculty}</h1>
          <p className="list-subtitle">Bölümlere göre derslikleri görüntüleyin</p>
          <button className="view-details-btn" onClick={handleBackToFaculties}>
            ← Fakültelere Dön
          </button>
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
                <th>Derslik Sayısı</th>
                <th>Toplam Kapasite</th>
                <th className="text-center">İşlemler</th>
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
                    <td className="text-center">
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
    const classrooms = groupedClassrooms[selectedFaculty][selectedDepartment] || [];
    
    return (
      <div className="list-container">
        <div className="list-header">
          <h1>{selectedDepartment}</h1>
          <p className="list-subtitle">Derslikleri görüntüleyin ve yönetin</p>
          <button className="view-details-btn" onClick={handleBackToDepartments}>
            ← Bölümlere Dön
          </button>
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
                {isAdmin && <th className="text-center">İşlemler</th>}
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
