import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses, deleteCourse, updateCourse, createCourse } from "../api";
import ExcelOperations from './ExcelOperations';
import PageHeader from './PageHeader';
import * as XLSX from 'xlsx';
import "../styles/ListView.css";
import "../styles/CourseList.css";
import "../styles/SearchStyles.css";
import { FACULTIES, DEPARTMENTS } from '../constants/facultiesAndDepartments';
import ExcelJS from 'exceljs';

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
        // Map faculty ID to display name
        const facultyObj = FACULTIES.find(f => f.id === course.faculty);
        const facultyName = facultyObj ? facultyObj.name : course.faculty;
        
        faculties.add(facultyName);
        if (!grouped.has(facultyName)) {
          grouped.set(facultyName, new Map());
        }
        const deptMap = grouped.get(facultyName);

        // Handle multiple departments
        if (course.departments && Array.isArray(course.departments)) {
          course.departments.forEach(dept => {
            // Find department name from DEPARTMENTS constant
            const departmentObj = DEPARTMENTS[course.faculty]?.find(d => d.id === dept.department);
            const departmentName = departmentObj ? departmentObj.name : dept.department;
            
            if (!deptMap.has(departmentName)) {
              deptMap.set(departmentName, new Set()); // Use Set to track unique courses
            }
            // Create a copy of the course with department-specific student count
            const courseCopy = {
              ...course,
              student_count: dept.student_count,
              department: departmentName, // Store the display name
              department_id: dept.department // Store the original department ID
            };
            deptMap.get(departmentName).add(courseCopy); // Add to Set instead of array
          });
        } else {
          // Fallback for backward compatibility
          const departmentObj = DEPARTMENTS[course.faculty]?.find(d => d.id === course.department);
          const departmentName = departmentObj ? departmentObj.name : course.department;
          
          if (!deptMap.has(departmentName)) {
            deptMap.set(departmentName, new Set()); // Use Set to track unique courses
          }
          const courseCopy = {
            ...course,
            department: departmentName, // Store the display name
            department_id: course.department // Store the original department ID
          };
          deptMap.get(departmentName).add(courseCopy); // Add to Set instead of array
        }
      });

      // Convert Map back to plain object for compatibility
      const groupedObj = {};
      grouped.forEach((deptMap, faculty) => {
        groupedObj[faculty] = {};
        deptMap.forEach((courses, dept) => {
          groupedObj[faculty][dept] = Array.from(courses); // Convert Set back to array
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
            {isAdmin ? (
              <span 
                className={`status-badge ${course.is_active ? 'active' : 'inactive'} clickable`}
                onClick={() => toggleCourseStatus(course.id, course.is_active)}
                title={course.is_active ? 'Pasif yap' : 'Aktif yap'}
              >
                {course.is_active ? 'Aktif' : 'Pasif'}
              </span>
            ) : (
              <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                {course.is_active ? 'Aktif' : 'Pasif'}
              </span>
            )}
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
        <PageHeader
          title="Dersler"
          subtitle="Fakülte ve bölümlere göre dersleri görüntüleyin"
          isAdmin={isAdmin}
          addButtonText="Yeni Ders Ekle"
          addButtonLink="/courses/new"
          onImport={handleExcelImport}
          onExport={handleExcelExport}
          templateData={courseTemplate}
          templateFileName="ders_sablonu"
        />
        
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
                <th>Toplam Öğrenci</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
                let totalStudents = 0;
                let departmentCount = 0;
                const uniqueCourses = new Set();
                const processedCourses = new Set(); // Track processed courses to avoid double counting
                
                if (groupedCourses[faculty]) {
                  departmentCount = Object.keys(groupedCourses[faculty]).length;
                  
                  Object.values(groupedCourses[faculty]).forEach(courses => {
                    courses.forEach(course => {
                      // Add course to unique set using code as identifier
                      uniqueCourses.add(course.code);
                      
                      // Only process each course once per faculty
                      if (!processedCourses.has(course.code)) {
                        processedCourses.add(course.code);
                        
                        // Calculate total students from all departments
                        if (course.departments && Array.isArray(course.departments)) {
                          // Sum up student counts from all departments for this course
                          const courseTotalStudents = course.departments.reduce((sum, dept) => {
                            return sum + (parseInt(dept.student_count) || 0);
                          }, 0);
                          totalStudents += courseTotalStudents;
                        } else if (course.student_count) {
                          // Fallback for backward compatibility
                          totalStudents += parseInt(course.student_count) || 0;
                        }
                      }
                    });
                  });
                }
                
                return (
                  <tr key={faculty}>
                    <td>{faculty}</td>
                    <td>{departmentCount}</td>
                    <td>{uniqueCourses.size}</td>
                    <td>{totalStudents}</td>
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
        <PageHeader
          title={selectedFaculty}
          subtitle="Bölümlere göre dersleri görüntüleyin"
          isAdmin={isAdmin}
          addButtonText="Yeni Ders Ekle"
          addButtonLink="/courses/new"
          backButtons={[
            {
              text: "← Fakültelere Dön",
              onClick: handleBackToFaculties
            }
          ]}
        />
        
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
                <th>Toplam Öğrenci</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments(departments).map(department => {
                const courses = groupedCourses[selectedFaculty][department];
                let totalStudents = 0;
                let uniqueCourses = new Set();
                
                courses.forEach(course => {
                  // Add course to unique set using code as identifier
                  uniqueCourses.add(course.code);
                  
                  // Calculate total students for this department
                  if (course.departments && Array.isArray(course.departments)) {
                    // Find the department-specific student count
                    const deptInfo = course.departments.find(d => d.department === course.department_id);
                    if (deptInfo) {
                      totalStudents += parseInt(deptInfo.student_count) || 0;
                    }
                  } else if (course.student_count) {
                    // Fallback for backward compatibility
                    totalStudents += parseInt(course.student_count) || 0;
                  }
                });
                
                return (
                  <tr key={department}>
                    <td>{department}</td>
                    <td>{uniqueCourses.size}</td>
                    <td>{totalStudents}</td>
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
      return <div>Ders bulunamadı</div>;
    }

    const courses = groupedCourses[selectedFaculty][selectedDepartment];

    return (
      <div className="courses-page">
        <PageHeader
          title={selectedDepartment}
          subtitle={selectedFaculty}
          isAdmin={isAdmin}
          addButtonText="Yeni Ders Ekle"
          addButtonLink="/courses/new"
          backButtons={[
            {
              text: "← Fakültelere Dön",
              onClick: handleBackToFaculties
            },
            {
              text: "← Bölümlere Dön",
              onClick: handleBackToDepartments
            }
          ]}
        />
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

  const handleExcelImport = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate and process each row
      for (const row of data) {
        const courseData = {
          name: row['Ders Adı'],
          code: row['Ders Kodu'],
          teacher_id: parseInt(row['Öğretmen ID']),
          faculty: row['Fakülte'],
          level: row['Seviye'],
          type: row['Tür'],
          category: row['Kategori'],
          semester: row['Dönem'],
          ects: parseInt(row['AKTS']),
          total_hours: parseInt(row['Toplam Saat']),
          is_active: row['Durum']?.toLowerCase() === 'aktif',
          sessions: [
            {
              type: row['Oturum Türü'],
              hours: parseInt(row['Oturum Saati'])
            }
          ],
          departments: [
            {
              department: row['Bölüm'],
              student_count: parseInt(row['Öğrenci Sayısı'])
            }
          ]
        };
        
        // Validate required fields
        if (!courseData.name || !courseData.code || !courseData.teacher_id || 
            !courseData.faculty || !courseData.level || !courseData.type || 
            !courseData.category || !courseData.semester || !courseData.ects || 
            !courseData.total_hours || !courseData.sessions[0].type || 
            !courseData.sessions[0].hours || !courseData.departments[0].department || 
            !courseData.departments[0].student_count) {
          throw new Error('Tüm alanların doldurulması zorunludur.');
        }
        
        // Validate type
        if (!['teorik', 'lab'].includes(courseData.type.toLowerCase())) {
          throw new Error('Geçersiz ders türü. Tür "teorik" veya "lab" olmalıdır.');
        }
        
        // Validate category
        if (!['zorunlu', 'secmeli'].includes(courseData.category.toLowerCase())) {
          throw new Error('Geçersiz kategori. Kategori "zorunlu" veya "secmeli" olmalıdır.');
        }
        
        // Create course
        await createCourse(courseData, token);
      }
      
      // Refresh the list
      await fetchCourses();
    } catch (err) {
      console.error('Error importing courses:', err);
      setError(err.message || 'Dersler içe aktarılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dersler');
    
    // Add headers
    worksheet.addRow([
      'Ders Adı',
      'Ders Kodu',
      'Öğretmen ID',
      'Fakülte',
      'Seviye',
      'Tür',
      'Kategori',
      'Dönem',
      'AKTS',
      'Toplam Saat',
      'Durum',
      'Oturum Türü',
      'Oturum Saati',
      'Bölüm',
      'Öğrenci Sayısı'
    ]);
    
    // Add data
    courses.forEach(course => {
      worksheet.addRow([
        course.name,
        course.code,
        course.teacher_id,
        course.faculty,
        course.level,
        course.type,
        course.category,
        course.semester,
        course.ects,
        course.total_hours,
        course.is_active ? 'Aktif' : 'Pasif',
        course.sessions[0]?.type || '',
        course.sessions[0]?.hours || '',
        course.departments[0]?.department || '',
        course.departments[0]?.student_count || ''
      ]);
    });
    
    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dersler.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const courseTemplate = [
    {
      'Ders Adı': 'Örnek Ders',
      'Ders Kodu': 'DERS101',
      'Öğretmen ID': '1',
      'Fakülte': 'Mühendislik Fakültesi',
      'Seviye': 'Lisans',
      'Tür': 'teorik',
      'Kategori': 'zorunlu',
      'Dönem': 'Güz',
      'AKTS': '6',
      'Toplam Saat': '3',
      'Durum': 'Aktif',
      'Oturum Türü': 'teorik',
      'Oturum Saati': '3',
      'Bölüm': 'Bilgisayar Mühendisliği',
      'Öğrenci Sayısı': '30'
    }
  ];

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
