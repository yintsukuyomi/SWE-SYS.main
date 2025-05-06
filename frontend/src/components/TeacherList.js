import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTeachers, deleteTeacher } from "../api";
import "../styles/TeacherList.css";
import { FACULTIES } from '../constants/facultiesAndDepartments';

const TeacherList = ({ token, user }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    teacherId: null,
    teacherName: ''
  });
  const [groupedTeachers, setGroupedTeachers] = useState({});
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, [token]);

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers(token);
      setTeachers(data);

      // Fakülte ve bölümlere göre gruplayarak organize edelim
      const grouped = {};
      const faculties = new Set();

      data.forEach(teacher => {
        // Fakülteyi kaydedelim
        faculties.add(teacher.faculty);

        // Fakülte bazında grupla
        if (!grouped[teacher.faculty]) {
          grouped[teacher.faculty] = {};
        }

        // Bölüm bazında grupla
        if (!grouped[teacher.faculty][teacher.department]) {
          grouped[teacher.faculty][teacher.department] = [];
        }

        // Öğretmeni ilgili fakülte ve bölüme ekle
        grouped[teacher.faculty][teacher.department].push(teacher);
      });

      setGroupedTeachers(grouped);
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
      teacherName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteTeacher(deleteConfirm.teacherId, token);
      setDeleteConfirm({
        show: false,
        teacherId: null,
        teacherName: ''
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

  // Fakülteler sayfası
  const renderFacultiesPage = () => {
    return (
      <div className="faculties-page">
        <h1 className="page-title">Faculties and Departments</h1>
        <p className="page-description">Browse teachers by faculty and department</p>
        
        <div className="faculty-cards">
          {facultyList.map(faculty => {
            // Her fakültedeki toplam öğretmen sayısını hesapla
            let totalTeachers = 0;
            let departmentCount = 0;
            
            if (groupedTeachers[faculty]) {
              departmentCount = Object.keys(groupedTeachers[faculty]).length;
              
              Object.values(groupedTeachers[faculty]).forEach(teachers => {
                totalTeachers += teachers.length;
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
                      <span className="stat-number">{totalTeachers}</span>
                      <span className="stat-label">Teachers</span>
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
    if (!selectedFaculty || !groupedTeachers[selectedFaculty]) {
      return <div>No departments found</div>;
    }
    
    const departments = Object.keys(groupedTeachers[selectedFaculty]);
    
    return (
      <div className="departments-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Back to Faculties
          </button>
        </div>
        
        <h1 className="page-title">{selectedFaculty}</h1>
        <p className="page-description">Departments and their teachers</p>
        
        <div className="department-cards">
          {departments.map(department => {
            const teachers = groupedTeachers[selectedFaculty][department];
            
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
                      <span className="stat-number">{teachers.length}</span>
                      <span className="stat-label">Teachers</span>
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

  // Öğretmenler sayfası
  const renderTeachersPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedTeachers[selectedFaculty] || 
        !groupedTeachers[selectedFaculty][selectedDepartment]) {
      return <div>No teachers found</div>;
    }
    
    const teachers = groupedTeachers[selectedFaculty][selectedDepartment];
    
    return (
      <div className="teachers-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Back to Faculties
          </button>
          <button className="back-button" onClick={handleBackToDepartments}>
            ← Back to Departments
          </button>
        </div>
        
        <div className="teacher-header">
          <div>
            <h1 className="page-title">{selectedDepartment}</h1>
            <p className="page-description">{selectedFaculty}</p>
          </div>
          
          {isAdmin && (
            <Link to="/teachers/new" className="add-button">
              <span className="btn-icon">+</span> Add New Teacher
            </Link>
          )}
        </div>
        
        <div className="teacher-cards">
          {teachers.map(teacher => (
            <div className="teacher-card-item" key={teacher.id}>
              <div className="teacher-card-header">
                <h3>{teacher.name}</h3>
              </div>
              <div className="teacher-card-body">
                <div className="teacher-info">
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{teacher.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Working Days:</span>
                    <span className="info-value">{teacher.working_days}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Working Hours:</span>
                    <span className="info-value">{teacher.working_hours}</span>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="teacher-actions">
                    <Link to={`/teachers/edit/${teacher.id}`} className="btn-edit">Edit</Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(teacher.id, teacher.name)}
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
      return <div className="loading">Loading teachers...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (teachers.length === 0) {
      return (
        <div className="empty-state">
          <div className="no-data-message">No teachers found.</div>
          {isAdmin && (
            <div className="empty-state-action">
              <Link to="/teachers/new" className="add-button">
                <span className="btn-icon">+</span> Add New Teacher
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
              <h3>Delete Confirmation</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.teacherName}</strong>?</p>
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

export default TeacherList;
