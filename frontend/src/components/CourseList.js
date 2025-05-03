import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses, deleteCourse } from "../api";
import "../styles/CourseList.css";
import { FACULTIES } from '../constants/facultiesAndDepartments';

const CourseList = ({ token, user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    courseId: null,
    courseName: ''
  });
  const [groupedCourses, setGroupedCourses] = useState({});
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    try {
      const data = await getCourses(token);
      setCourses(data);

      // Fakülte ve bölümlere göre gruplayarak organize edelim
      const grouped = {};
      const faculties = new Set();

      data.forEach(course => {
        // Fakülteyi kaydedelim
        faculties.add(course.faculty);

        // Fakülte bazında grupla
        if (!grouped[course.faculty]) {
          grouped[course.faculty] = {};
        }

        // Bölüm bazında grupla
        if (!grouped[course.faculty][course.department]) {
          grouped[course.faculty][course.department] = [];
        }

        // Dersi ilgili fakülte ve bölüme ekle
        grouped[course.faculty][course.department].push(course);
      });

      setGroupedCourses(grouped);
      setFacultyList([...faculties].sort());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({
      show: true,
      courseId: id,
      courseName: name
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      courseId: null,
      courseName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteCourse(deleteConfirm.courseId, token);
      setDeleteConfirm({
        show: false,
        courseId: null,
        courseName: ''
      });
      // Ders listesini yeniden yükle
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      
      // Hatayı daha kullanıcı dostu bir şekilde göster
      let errorMessage = "Failed to delete course.";
      
      // Programda kullanılan derslerin silinememesi için özel mesaj
      if (error.detail && error.detail.includes("used in schedules")) {
        errorMessage = "This course cannot be deleted because it is currently scheduled in the timetable. Please remove all schedule entries for this course first.";
      } else if (error.detail) {
        errorMessage += " " + error.detail;
      }
      
      setError(errorMessage);
      
      // Hata olsa bile modal'ı kapat
      setDeleteConfirm({
        show: false,
        courseId: null,
        courseName: ''
      });
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
        <h1 className="page-title">Faculties and Programs</h1>
        <p className="page-description">Browse faculties and their departments</p>
        
        <div className="faculty-cards">
          {facultyList.map(faculty => {
            // Her fakültedeki toplam ders ve öğrenci sayısını hesapla
            let totalCourses = 0;
            let departmentCount = 0;
            
            if (groupedCourses[faculty]) {
              departmentCount = Object.keys(groupedCourses[faculty]).length;
              
              Object.values(groupedCourses[faculty]).forEach(courses => {
                totalCourses += courses.length;
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
                      <span className="stat-number">{totalCourses}</span>
                      <span className="stat-label">Courses</span>
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
    if (!selectedFaculty || !groupedCourses[selectedFaculty]) {
      return <div>No departments found</div>;
    }
    
    const departments = Object.keys(groupedCourses[selectedFaculty]);
    
    return (
      <div className="departments-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Back to Faculties
          </button>
        </div>
        
        <h1 className="page-title">{selectedFaculty}</h1>
        <p className="page-description">Departments and their courses</p>
        
        <div className="department-cards">
          {departments.map(department => {
            const courses = groupedCourses[selectedFaculty][department];
            
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
                      <span className="stat-number">{courses.length}</span>
                      <span className="stat-label">Courses</span>
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

  // Kurslar sayfası
  const renderCoursesPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedCourses[selectedFaculty] || 
        !groupedCourses[selectedFaculty][selectedDepartment]) {
      return <div>No courses found</div>;
    }
    
    const courses = groupedCourses[selectedFaculty][selectedDepartment];
    
    return (
      <div className="courses-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Back to Faculties
          </button>
          <button className="back-button" onClick={handleBackToDepartments}>
            ← Back to Departments
          </button>
        </div>
        
        <div className="course-header">
          <div>
            <h1 className="page-title">{selectedDepartment}</h1>
            <p className="page-description">{selectedFaculty}</p>
          </div>
          
          {isAdmin && (
            <Link to="/courses/new" className="add-button">
              <span className="btn-icon">+</span> Add New Course
            </Link>
          )}
        </div>
        
        <div className="course-cards">
          {courses.map(course => (
            <div className="course-card-item" key={course.id}>
              <div className="course-card-header">
                <span className="course-code">{course.code}</span>
                <h3>{course.name}</h3>
              </div>
              <div className="course-card-body">
                <div className="course-info">
                  <div className="info-row">
                    <span className="info-label">Teacher:</span>
                    <span className="info-value">
                      {course.teacher ? course.teacher.name : 'No teacher assigned'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Level:</span>
                    <span className="info-value">{course.level}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{course.type}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">ECTS:</span>
                    <span className="info-value">{course.ects}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Hours:</span>
                    <span className="info-value">{course.total_hours}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="course-actions">
                    <Link to={`/courses/edit/${course.id}`} className="btn-edit">Edit</Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(course.id, course.name)}
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
      return <div className="loading">Loading courses...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (courses.length === 0) {
      return (
        <div className="empty-state">
          <div className="no-data-message">No courses found.</div>
          {isAdmin && (
            <div className="empty-state-action">
              <Link to="/courses/new" className="add-button">
                <span className="btn-icon">+</span> Add New Course
              </Link>
            </div>
          )}
        </div>
      );
    }
    
    if (selectedFaculty && selectedDepartment) {
      return renderCoursesPage();
    }
    
    if (selectedFaculty) {
      return renderDepartmentsPage();
    }
    
    return renderFacultiesPage();
  };

  return (
    <div className="courses-container">
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Delete Confirmation</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.courseName}</strong>?</p>
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

export default CourseList;
