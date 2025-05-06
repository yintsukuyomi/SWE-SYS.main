import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses, deleteCourse, updateCourse } from "../api"; // Eklendi: updateCourse
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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Dersleri arama fonksiyonu
  const filteredCourses = (courseList) => {
    if (!searchTerm) return courseList;
    
    return courseList.filter(course => 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.teacher && course.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Aktiflik durumuna göre de filtreleme yapalım
      (searchTerm.toLowerCase() === 'aktif' && course.is_active) ||
      (searchTerm.toLowerCase() === 'pasif' && !course.is_active)
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

  // Kurs aktivasyon durumunu değiştirme fonksiyonu
  const toggleCourseStatus = async (courseId, isCurrentlyActive) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;
  
      const updateData = {
        ...course,
        is_active: !isCurrentlyActive
      };
  
      await updateCourse(courseId, updateData, token);
      
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c.id === courseId ? { ...c, is_active: !isCurrentlyActive } : c
        )
      );
  
      setGroupedCourses(prevGrouped => {
        const newGrouped = { ...prevGrouped };
        Object.keys(newGrouped).forEach(faculty => {
          Object.keys(newGrouped[faculty]).forEach(department => {
            newGrouped[faculty][department] = newGrouped[faculty][department].map(c => 
              c.id === courseId ? { ...c, is_active: !isCurrentlyActive } : c
            );
          });
        });
        return newGrouped;
      });
    } catch (error) {
      console.error("Error updating course status:", error);
      setError(error.response?.data?.detail || "Ders durumu güncellenirken bir hata oluştu.");
    }
  };

  // Fakülteler sayfasını değiştirme fonksiyonu
  const renderFacultiesPage = () => {
    return (
      <div className="faculties-page">
        <h1 className="page-title">Fakülteler ve Programlar</h1>
        <p className="page-description">Fakülteler ve bölümlere göre dersleri görüntüleyin</p>
        
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
                <th>Ders Sayısı</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
                // Her fakültedeki toplam ders ve bölüm sayısını hesapla
                let totalCourses = 0;
                let departmentCount = 0;
                if (groupedCourses[faculty]) {
                  departmentCount = Object.keys(groupedCourses[faculty]).length;
                  Object.values(groupedCourses[faculty]).forEach(courses => {
                    totalCourses += courses.length;
                  });
                }
                return (
                  <tr key={faculty}>
                    <td>{faculty}</td>
                    <td>{departmentCount}</td>
                    <td>{totalCourses}</td>
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
    if (!selectedFaculty || !groupedCourses[selectedFaculty]) {
      return <div>Bölüm bulunamadı</div>;
    }

    const departments = Object.keys(groupedCourses[selectedFaculty]);

    return (
      <div className="departments-page">
        <div className="page-navigation">
          <button className="back-button" onClick={handleBackToFaculties}>
            ← Fakültelere Dön
          </button>
        </div>
        <h1 className="page-title">{selectedFaculty}</h1>
        <p className="page-description">Bölümler ve dersleri</p>
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
                <th>Ders Sayısı</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments(departments).map(department => {
                const courses = groupedCourses[selectedFaculty][department];
                return (
                  <tr key={department}>
                    <td>{department}</td>
                    <td>{courses.length}</td>
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
            ← Fakültelere Dön
          </button>
          <button className="back-button" onClick={handleBackToDepartments}>
            ← Bölümlere Dön
          </button>
        </div>
        <div className="course-header">
          <div>
            <h1 className="page-title">{selectedDepartment}</h1>
            <p className="page-description">{selectedFaculty}</p>
          </div>
          {isAdmin && (
            <Link to="/courses/new" className="add-button">
              <span className="btn-icon">+</span> Yeni Ders Ekle
            </Link>
          )}
        </div>
        <div className="search-container with-search-icon">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Ders ara... (ders kodu, adı, öğretmen, 'aktif' veya 'pasif')"
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
        <div className="course-list">
          <table className="list-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Ders Adı</th>
                <th>Öğretmen</th>
                <th>Seviye</th>
                <th>Tür</th>
                <th>AKTS</th>
                <th>Saat</th>
                <th>Durum</th>
                {isAdmin && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCourses(courses).map(course => (
                <tr key={course.id}>
                  <td className="course-code-cell">{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.teacher ? course.teacher.name : 'Atanmamış'}</td>
                  <td>{course.level}</td>
                  <td>{course.type}</td>
                  <td className="text-center">{course.ects}</td>
                  <td className="text-center">{course.total_hours}</td>
                  <td>
                    <span 
                      onClick={() => toggleCourseStatus(course.id, course.is_active)}
                      className={`status-badge clickable ${course.is_active ? 'active' : 'inactive'}`}
                      title={course.is_active ? 'Dersi pasif yap' : 'Dersi aktif yap'}
                    >
                      {course.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="action-buttons">
                      <Link to={`/courses/edit/${course.id}`} className="btn-edit">Düzenle</Link>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteClick(course.id, course.name)}
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
      return <div className="loading">Dersler yükleniyor...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (courses.length === 0) {
      return (
        <div className="empty-state">
          <div className="no-data-message">Hiç ders bulunamadı.</div>
          {isAdmin && (
            <div className="empty-state-action">
              <Link to="/courses/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Ders Ekle
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
              <h3>Silme Onayı</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>{deleteConfirm.courseName}</strong> adlı dersi silmek istediğinizden emin misiniz?</p>
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

export default CourseList;
