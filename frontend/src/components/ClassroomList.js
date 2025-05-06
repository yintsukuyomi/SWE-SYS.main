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

  // Fakülteler sayfası
  const renderFacultiesPage = () => {
    return (
      <div className="faculties-page">
        <h1 className="page-title">Faculties and Buildings</h1>
        <p className="page-description">Browse classrooms by faculty and department</p>
        
        <div className="faculty-cards">
          {facultyList.map(faculty => {
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
              <div 
                className="faculty-card-item" 
                key={faculty}
                onClick={() => handleFacultySelect(faculty)}
              >
                <div className="faculty-card-header">
                  <h2>{faculty}</h2>
                </div>
                <div className="faculty-card-body">
                  <div className="faculty-stats">
                    <div className="stat">
                      <span className="stat-number">{departmentCount}</span>
                      <span className="stat-label">Departments</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{totalClassrooms}</span>
                      <span className="stat-label">Classrooms</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{totalCapacity}</span>
                      <span className="stat-label">Total Capacity</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Bölümler sayfası
  const renderDepartmentsPage = () => {
    if (!selectedFaculty || !groupedClassrooms[selectedFaculty]) {
      return <div>No departments found</div>;
    }
    
    const departments = Object.keys(groupedClassrooms[selectedFaculty]);
    
    return (
      <div className="departments-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Back to Faculties
          </button>
        </div>
        
        <h1 className="page-title">{selectedFaculty}</h1>
        <p className="page-description">Departments and their classrooms</p>
        
        <div className="department-cards">
          {departments.map(department => {
            const classrooms = groupedClassrooms[selectedFaculty][department];
            let totalCapacity = 0;
            
            classrooms.forEach(classroom => {
              totalCapacity += classroom.capacity || 0;
            });
            
            return (
              <div 
                className="department-card-item" 
                key={department}
                onClick={() => handleDepartmentSelect(department)}
              >
                <div className="department-card-header">
                  <h2>{department}</h2>
                </div>
                <div className="department-card-body">
                  <div className="department-stats">
                    <div className="stat">
                      <span className="stat-number">{classrooms.length}</span>
                      <span className="stat-label">Classrooms</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{totalCapacity}</span>
                      <span className="stat-label">Total Capacity</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Sınıflar sayfası
  const renderClassroomsPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedClassrooms[selectedFaculty] || 
        !groupedClassrooms[selectedFaculty][selectedDepartment]) {
      return <div>No classrooms found</div>;
    }
    
    const classrooms = groupedClassrooms[selectedFaculty][selectedDepartment];
    
    return (
      <div className="classrooms-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Back to Faculties
          </button>
          <button className="back-button" onClick={handleBackToDepartments}>
            ← Back to Departments
          </button>
        </div>
        
        <div className="classroom-header">
          <div>
            <h1 className="page-title">{selectedDepartment}</h1>
            <p className="page-description">{selectedFaculty}</p>
          </div>
          
          {isAdmin && (
            <Link to="/classrooms/new" className="add-button">
              <span className="btn-icon">+</span> Add New Classroom
            </Link>
          )}
        </div>
        
        <div className="classroom-cards">
          {classrooms.map(classroom => (
            <div className="classroom-card-item" key={classroom.id}>
              <div className="classroom-card-header">
                <div className="classroom-type">{classroom.type}</div>
                <h3>{classroom.name}</h3>
              </div>
              <div className="classroom-card-body">
                <div className="classroom-info">
                  <div className="capacity-indicator">
                    <div className="capacity-value">{classroom.capacity}</div>
                    <div className="capacity-label">Capacity</div>
                  </div>
                  
                  <div className="classroom-details">
                    <div className="info-row">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{classroom.type}</span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="classroom-actions">
                    <Link to={`/classrooms/edit/${classroom.id}`} className="btn-edit">Edit</Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(classroom.id, classroom.name)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Hangi sayfayı göstereceğimize karar ver
  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading classrooms...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (classrooms.length === 0) {
      return (
        <div className="empty-state">
          <div className="no-data-message">No classrooms found.</div>
          {isAdmin && (
            <div className="empty-state-action">
              <Link to="/classrooms/new" className="add-button">
                <span className="btn-icon">+</span> Add New Classroom
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
              <h3>Delete Confirmation</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.classroomName}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDelete} className="btn-cancel">Cancel</button>
              <button onClick={confirmDelete} className="btn-delete">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

export default ClassroomList;
