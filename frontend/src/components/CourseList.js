import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses, deleteCourse, updateCourse } from "../api"; // Eklendi: updateCourse
import "../styles/ListView.css";
import "../styles/SearchStyles.css";
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

      // Use Map for grouping for better performance
      const grouped = new Map();
      const faculties = new Set();

      data.forEach(course => {
        faculties.add(course.faculty);
        if (!grouped.has(course.faculty)) {
          grouped.set(course.faculty, new Map());
        }
        const deptMap = grouped.get(course.faculty);
        if (!deptMap.has(course.department)) {
          deptMap.set(course.department, []);
        }
        deptMap.get(course.department).push(course);
      });

      // Convert Map back to plain object for compatibility
      const groupedObj = {};
      grouped.forEach((deptMap, faculty) => {
        groupedObj[faculty] = {};
        deptMap.forEach((courses, dept) => {
          groupedObj[faculty][dept] = courses;
        });
      });

      setGroupedCourses(groupedObj);
      setFacultyList([...faculties].sort());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    // Ensure name is a string, not an object
    const courseName = typeof name === "object" && name !== null ? name.name : name;
    
    setDeleteConfirm({
      show: true,
      courseId: id,
      courseName: courseName
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
    // Only filter on courses page
    let filtered = courseList;
    if (searchTerm && selectedDepartment) {
      filtered = courseList.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.teacher && course.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchTerm.toLowerCase() === 'aktif' && course.is_active) ||
        (searchTerm.toLowerCase() === 'pasif' && !course.is_active)
      );
    }
    // Sort courses alphabetically by name
    return filtered.slice().sort((a, b) => {
      // If name is an object (e.g. {id, name}), use .name
      const aName = typeof a.name === "object" && a.name !== null ? a.name.name : a.name;
      const bName = typeof b.name === "object" && b.name !== null ? b.name.name : b.name;
      return String(aName).localeCompare(String(bName), 'tr');
    });
  };

  // Fakülteleri arama fonksiyonu
  const filteredFaculties = () => {
    // Only filter on faculties page
    if (!searchTerm || selectedFaculty || selectedDepartment) 
      return facultyList.slice().sort((a, b) => a.localeCompare(b, 'tr'));
    return facultyList
      .filter(faculty => faculty.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'tr'));
  };

  // Bölümleri arama fonksiyonu
  const filteredDepartments = (departments) => {
    // Filter only on departments page (when selectedFaculty is set and selectedDepartment is NOT set)
    if (!searchTerm || !selectedFaculty || selectedDepartment)
      return departments.slice().sort((a, b) => a.localeCompare(b, 'tr'));
    return departments
      .filter(department => department.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'tr'));
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

  // Yardımcı fonksiyon: Obje render hatasını önler
  const safeText = (val) => {
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (val && typeof val === 'object' && 'name' in val) return val.name;
    if (val && typeof val === 'object' && 'msg' in val) return val.msg;
    return '';
  };

  const renderCourseItem = (course) => {
    return (
      <div className="course-item" key={course.id}>
        <div className="course-details">
          <div className="course-code-name">
            <span className="course-code">{safeText(course.code)}</span>
            <span className="course-name">{safeText(course.name)}</span>
          </div>
          <div className="course-meta-row">
            {course.teacher && (
              <span className="teacher-name">{safeText(course.teacher.name || course.teacher)}</span>
            )}
            <span className="course-type">
              {safeText(course.type) === 'teorik' ? 'Teorik' : safeText(course.type) === 'laboratuvar' ? 'Laboratuvar' : safeText(course.type)}
            </span>
            <span className="course-category">
              {safeText(course.category) === 'zorunlu' ? 'Zorunlu' : safeText(course.category) === 'seçmeli' ? 'Seçmeli' : safeText(course.category)}
            </span>
            <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>{course.is_active ? 'Aktif' : 'Pasif'}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="course-actions">
            <Link to={`/courses/edit/${course.id}`} className="btn-edit">
              Düzenle
            </Link>
            <button
              className="btn-delete"
              onClick={() => handleDeleteClick(course.id, course.name)}
            >
              Sil
            </button>
          </div>
        )}
      </div>
    );
  };

  // Fakülteler sayfası
  const renderFacultiesPage = () => {
    return (
      <div className="list-container">
        <div className="list-header">
          <div className="header-content">
            <h1>Dersler</h1>
            <p className="list-subtitle">Fakülte ve bölümlere göre dersleri görüntüleyin</p>
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
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
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
    const departments = Object.keys(groupedCourses[selectedFaculty] || {});
    
    return (
      <div className="list-container">
        <div className="list-header">
          <div className="header-content">
            <h1>{selectedFaculty}</h1>
            <p className="list-subtitle">Bölümlere göre dersleri görüntüleyin</p>
          </div>
          <div className="header-actions">
            <button className="back-button" onClick={handleBackToFaculties}>
              ← Fakültelere Dön
            </button>
            {isAdmin && (
              <Link to="/courses/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Ders Ekle
              </Link>
            )}
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
                <th>Ders Sayısı</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments(departments).map(department => {
                const courses = groupedCourses[selectedFaculty][department];
                return (
                  <tr key={department}>
                    <td>{department}</td>
                    <td>{courses.length}</td>
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
        <div className="list-header">
          <div className="header-content">
            <h1>{selectedDepartment}</h1>
            <p className="list-subtitle">{selectedFaculty}</p>
          </div>
          <div className="header-actions">
            <button className="back-button" onClick={handleBackToFaculties}>
              ← Fakültelere Dön
            </button>
            <button className="back-button" onClick={handleBackToDepartments}>
              ← Bölümlere Dön
            </button>
            {isAdmin && (
              <Link to="/courses/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Ders Ekle
              </Link>
            )}
          </div>
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
          {filteredCourses(courses).map(course => renderCourseItem(course))}
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
