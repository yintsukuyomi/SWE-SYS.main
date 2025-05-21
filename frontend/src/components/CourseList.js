import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses, deleteCourse, updateCourse, createCourse, getTeachers } from "../api";
import ExcelOperations from './ExcelOperations';
import PageHeader from './PageHeader';
import * as XLSX from 'xlsx';
import "../styles/ListView.css";
import "../styles/CourseList.css";
import "../styles/SearchStyles.css";
import { FACULTIES, DEPARTMENTS } from '../constants/facultiesAndDepartments';
import ExcelJS from 'exceljs';
import { toast } from 'react-toastify';

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
  const [pendingExcelData, setPendingExcelData] = useState(null);
  const [excelError, setExcelError] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAction, setOverrideAction] = useState('skip');
  const [duplicateCourses, setDuplicateCourses] = useState([]);
  const [excelImportData, setExcelImportData] = useState([]);

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
      toast.success("Dersler başarıyla yüklendi.");
    } catch (error) {
      let errorMessage = "Dersler yüklenirken bir hata oluştu";
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
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
      toast.success("Ders başarıyla silindi.");
      setDeleteConfirm({
        show: false,
        courseId: null,
        courseName: ''
      });
      // Ders listesini yeniden yükle
      fetchCourses();
    } catch (error) {
      let errorMessage = "Ders silinemedi.";
      if (error.detail && error.detail.includes("used in schedules")) {
        errorMessage = "Bu ders programda kullanıldığı için silinemez. Önce programdan kaldırın.";
      } else if (error.detail) {
        errorMessage += " " + error.detail;
      }
      setError(errorMessage);
      toast.error(errorMessage);
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
      toast.success("Ders durumu güncellendi.");
    } catch (error) {
      let errorMessage = "Ders durumu güncellenirken bir hata oluştu.";
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
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

  const exportWithTemplate = async ({ data, headers, fileName, sheetName = 'Sheet', colWidth = 16 }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.addRow(headers);
    headers.forEach((header, idx) => {
      const cell = worksheet.getCell(1, idx + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
      cell.protection = { locked: true };
      worksheet.getColumn(idx + 1).width = colWidth;
    });
    data.forEach(rowObj => {
      const row = headers.map(h => rowObj[h] ?? '');
      const addedRow = worksheet.addRow(row);
      addedRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF9C4' }
        };
        cell.protection = { locked: false };
      });
    });
    worksheet.protect('sifre', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExcelExport = async () => {
    const headers = [
      'Ders Adı',
      'Ders Kodu',
      'Öğretmen Adı',
      'Fakülte',
      'Seviye',
      'Tür',
      'Kategori',
      'Dönem',
      'AKTS',
      'Durum',
      'Oturum Türü',
      'Oturum Saati',
      'Bölüm',
      'Öğrenci Sayısı'
    ];
    const exportData = [];
    courses.forEach(course => {
      const isActive = course.is_active ? 'Aktif' : 'Pasif';
      const teacherName = (course.teacher && course.teacher.name) || course.teacher_name || '';
      const faculty = course.faculty;
      const level = course.level;
      const category = course.category;
      const semester = course.semester;
      const ects = course.ects;
      const code = course.code;
      const name = course.name;
      const departments = Array.isArray(course.departments) ? course.departments : [];
      const sessions = Array.isArray(course.sessions) ? course.sessions : [];
      if (departments.length === 0) {
        if (sessions.length === 0) {
          exportData.push({
            'Ders Adı': name,
            'Ders Kodu': code,
            'Öğretmen Adı': teacherName,
            'Fakülte': faculty,
            'Seviye': level,
            'Tür': course.type || (course.sessions && course.sessions[0]?.type) || course['Tür'] || '',
            'Kategori': category,
            'Dönem': semester,
            'AKTS': ects,
            'Durum': isActive,
            'Oturum Türü': '',
            'Oturum Saati': '',
            'Bölüm': '',
            'Öğrenci Sayısı': ''
          });
        } else {
          sessions.forEach(session => {
            exportData.push({
              'Ders Adı': name,
              'Ders Kodu': code,
              'Öğretmen Adı': teacherName,
              'Fakülte': faculty,
              'Seviye': level,
              'Tür': course.type || (course.sessions && course.sessions[0]?.type) || course['Tür'] || '',
              'Kategori': category,
              'Dönem': semester,
              'AKTS': ects,
              'Durum': isActive,
              'Oturum Türü': session.type,
              'Oturum Saati': session.hours,
              'Bölüm': '',
              'Öğrenci Sayısı': ''
            });
          });
        }
      } else {
        departments.forEach(dept => {
          if (sessions.length === 0) {
            exportData.push({
              'Ders Adı': name,
              'Ders Kodu': code,
              'Öğretmen Adı': teacherName,
              'Fakülte': faculty,
              'Seviye': level,
              'Tür': course.type || (course.sessions && course.sessions[0]?.type) || course['Tür'] || '',
              'Kategori': category,
              'Dönem': semester,
              'AKTS': ects,
              'Durum': isActive,
              'Oturum Türü': '',
              'Oturum Saati': '',
              'Bölüm': dept.department,
              'Öğrenci Sayısı': dept.student_count
            });
          } else {
            sessions.forEach(session => {
              exportData.push({
                'Ders Adı': name,
                'Ders Kodu': code,
                'Öğretmen Adı': teacherName,
                'Fakülte': faculty,
                'Seviye': level,
                'Tür': course.type || (course.sessions && course.sessions[0]?.type) || course['Tür'] || '',
                'Kategori': category,
                'Dönem': semester,
                'AKTS': ects,
                'Durum': isActive,
                'Oturum Türü': session.type,
                'Oturum Saati': session.hours,
                'Bölüm': dept.department,
                'Öğrenci Sayısı': dept.student_count
              });
            });
          }
        });
      }
    });
    await exportWithTemplate({
      data: exportData,
      headers,
      fileName: 'dersler',
      sheetName: 'Dersler',
      colWidth: 16
    });
    toast.success('Dersler başarıyla dışa aktarıldı.');
  };

  // Normalizasyon fonksiyonu
  const normalizeCourse = (row) => ({
    name: row.name || row['Ders Adı'],
    code: row.code || row['Ders Kodu'],
    teacher_id: row.teacher_id,
    faculty: row.faculty || row['Fakülte'],
    level: row.level || row['Seviye'] || '',
    category: row.category || row['Kategori'],
    semester: row.semester || row['Dönem'],
    ects: row.ects || parseInt(row['AKTS']),
    is_active: typeof row.is_active === 'boolean' ? row.is_active : (row['Durum'] || '').toLowerCase() === 'aktif',
    sessions: Array.isArray(row.sessions) ? row.sessions : [],
    departments: Array.isArray(row.departments) ? row.departments : [],
  });

  const handleExcelImport = async (data) => {
    const filteredData = data.filter(row =>
      Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '')
    );
    try {
      const teachers = await getTeachers(token);
      const typeMap = {
        'teorik': 'teorik',
        'lab': 'lab',
        'theoretical': 'teorik',
        'lecture': 'teorik',
        'laboratory': 'lab',
        'laboratuvar': 'lab',
        'uygulama': 'lab',
        'uygulamalı': 'lab'
      };
      const categoryMap = {
        'zorunlu': 'zorunlu',
        'secmeli': 'secmeli',
        'seçmeli': 'secmeli',
        'compulsory': 'zorunlu',
        'mandatory': 'zorunlu',
        'elective': 'secmeli',
        'electives': 'secmeli'
      };
      const courseMap = {};
      for (let i = 0; i < filteredData.length; i++) {
        const row = filteredData[i];
        if (!row['Ders Adı'] || !row['Ders Kodu'] || !row['Fakülte'] || !row['Kategori'] || !row['Dönem'] || !row['AKTS']) {
          setExcelError(`Satır ${i + 2}: Eksik zorunlu alan. (Ders Adı, Ders Kodu, Fakülte, Kategori, Dönem, AKTS)`);
          return;
        }
        let teacherId;
        if (row['Öğretmen Adı']) {
          const found = teachers.find(t => t.name.trim().toLowerCase() === row['Öğretmen Adı'].trim().toLowerCase());
          if (!found) {
            setExcelError(`Satır ${i + 2}: Öğretmen bulunamadı: "${row['Öğretmen Adı']}"`);
            return;
          }
          teacherId = found.id;
        }
        // Kullanıcı dostu: 'Tür' boşsa 'Oturum Türü'nden al
        let rawType = (row['Tür'] || row['Oturum Türü'] || '').toLowerCase();
        const mappedType = typeMap[rawType];
        if (!mappedType) {
          setExcelError(`Satır ${i + 2}: Geçersiz ders türü "${row['Tür'] ? row['Tür'] : row['Oturum Türü'] ? row['Oturum Türü'] : 'boş'}". Tür "teorik" veya "lab" olmalıdır.`);
          return;
        }
        row['Tür'] = mappedType;
        const rawCategory = (row['Kategori'] || '').toLowerCase();
        const mappedCategory = categoryMap[rawCategory];
        if (!mappedCategory) {
          setExcelError(`Satır ${i + 2}: Geçersiz kategori "${row['Kategori'] ? row['Kategori'] : 'boş'}". Kategori "zorunlu" veya "secmeli" olmalıdır.`);
          return;
        }
        row['Kategori'] = mappedCategory;
        const key = `${row['Ders Kodu']}|${row['Ders Adı']}`;
        if (!courseMap[key]) {
          courseMap[key] = {
            name: row['Ders Adı'],
            code: row['Ders Kodu'],
            teacher_id: teacherId,
            faculty: row['Fakülte'],
            level: row['Seviye'] || '',
            type: mappedType,
            category: mappedCategory,
            semester: row['Dönem'],
            ects: parseInt(row['AKTS']),
            is_active: (row['Durum'] || '').toLowerCase() === 'aktif',
            departments: [],
            sessions: []
          };
        }
        if (row['Bölüm']) {
          // Aynı bölüm daha önce eklendi mi kontrol et
          if (!courseMap[key].departments.some(
            d => d.department === row['Bölüm'] && d.student_count === (row['Öğrenci Sayısı'] ? parseInt(row['Öğrenci Sayısı']) : 0)
          )) {
            courseMap[key].departments.push({
              department: row['Bölüm'],
              student_count: row['Öğrenci Sayısı'] ? parseInt(row['Öğrenci Sayısı']) : 0
            });
          }
        }
        if (row['Oturum Türü'] && row['Oturum Saati']) {
          // Aynı oturum daha önce eklendi mi kontrol et
          if (!courseMap[key].sessions.some(
            s => s.type === (row['Oturum Türü'] || '').toLowerCase() && s.hours === parseInt(row['Oturum Saati'])
          )) {
            courseMap[key].sessions.push({
              type: (row['Oturum Türü'] || '').toLowerCase(),
              hours: parseInt(row['Oturum Saati'])
            });
          }
        }
      }
      const mergedCourses = Object.values(courseMap);
      // Çakışma kontrolü
      const existingCodes = courses.map(c => c.code.toLowerCase());
      const duplicates = mergedCourses.filter(row => existingCodes.includes((row.code || '').toLowerCase()));
      if (duplicates.length > 0) {
        setDuplicateCourses(duplicates);
        setExcelImportData(mergedCourses);
        setShowOverrideModal(true);
        return;
      }
      setPendingExcelData(mergedCourses);
      setShowExcelModal(true);
    } catch (err) {
      setExcelError(err.message || 'Dersler içe aktarılırken bir hata oluştu.');
    }
  };

  // Modal onay fonksiyonu
  const handleOverrideConfirm = async () => {
    setShowOverrideModal(false);
    setShowExcelModal(false);
    setLoading(true);
    setExcelError(null);
    try {
      let toCreate = [];
      let toUpdate = [];
      const existingMap = {};
      courses.forEach(c => { existingMap[c.code.toLowerCase()] = c; });
      let missingTeacherRows = [];
      excelImportData.forEach(row => {
        const code = (row['Ders Kodu'] || row.code || '').toLowerCase();
        // teacher_id zorunlu, yoksa atla ve bildir
        if (!row.teacher_id) {
          missingTeacherRows.push(row);
          return;
        }
        if (existingMap[code]) {
          if (overrideAction === 'override') toUpdate.push(row);
          // skip ise atla
        } else {
          toCreate.push(row);
        }
      });
      if (missingTeacherRows.length > 0) {
        setExcelError('Bazı satırlarda öğretmen bulunamadı veya atanmadı. Lütfen Excel dosyanızda öğretmen adlarını kontrol edin.');
        setLoading(false);
        return;
      }
      // CREATE
      for (const row of toCreate) {
        await createCourse(normalizeCourse(row), token);
      }
      // UPDATE
      for (const row of toUpdate) {
        const code = (row['Ders Kodu'] || row.code || '').toLowerCase();
        const existing = existingMap[code];
        if (!existing) continue;
        await updateCourse(existing.id, normalizeCourse(row), token);
      }
      toast.success('Dersler başarıyla işlendi.');
      fetchCourses();
    } catch (err) {
      setExcelError(err.message || 'Dersler eklenirken hata oluştu.');
    } finally {
      setLoading(false);
      setPendingExcelData(null);
      setExcelImportData([]);
      setDuplicateCourses([]);
    }
  };

  const courseTemplate = [
    {
      'Ders Adı': 'Örnek Ders',
      'Ders Kodu': 'DERS101',
      'Öğretmen Adı': 'Örnek Öğretmen',
      'Fakülte': 'Mühendislik Fakültesi',
      'Seviye': 'Lisans',
      'Tür': 'teorik',
      'Kategori': 'zorunlu',
      'Dönem': 'Güz',
      'AKTS': '6',
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
          <div className="no-data-message">Hiç ders bulunamadı.</div>
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
      {excelError && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Hata</h3>
              <button className="close-button" onClick={() => setExcelError(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>{excelError}</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setExcelError(null)} className="btn-cancel">Tamam</button>
            </div>
          </div>
        </div>
      )}
      {showExcelModal && pendingExcelData && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Excel'den Eklenecek Dersler</h3>
              <button className="close-button" onClick={() => setShowExcelModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>{pendingExcelData.length}</strong> adet ders eklenecek. Lütfen kontrol edin:
              </p>
              <div className="excel-preview-table-wrapper">
                <table className="excel-preview-table">
                  <thead>
                    <tr>
                      <th>Ders Adı</th>
                      <th>Kod</th>
                      <th>Tür</th>
                      <th>Fakülte</th>
                      <th>Bölümler</th>
                      <th>Oturumlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingExcelData.map((course, idx) => (
                      <tr key={idx}>
                        <td>{course.name}</td>
                        <td>{course.code}</td>
                        <td>{course.type}</td>
                        <td>{course.faculty}</td>
                        <td>{course.departments && course.departments.length > 0 ? course.departments.map(d => d.department).join(', ') : '-'}</td>
                        <td>{course.sessions && course.sessions.length > 0 ? course.sessions.map(s => `${s.type} (${s.hours} saat)`).join(', ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="warning-text">Bu işlem geri alınamaz. Onaylıyor musunuz?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowExcelModal(false)} className="btn-cancel">İptal</button>
              <button onClick={handleOverrideConfirm} className="btn-submit">Ekle</button>
            </div>
          </div>
        </div>
      )}
      {showOverrideModal && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Çakışan Dersler</h3>
              <button className="close-button" onClick={() => setShowOverrideModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Eklemeye çalıştığınız bazı dersler mevcut kod ile zaten kayıtlı:</p>
              <ul>
                {duplicateCourses.map((c, i) => (
                  <li key={i}>{c.name} - {c.code}</li>
                ))}
              </ul>
              <div style={{marginTop: '10px'}}>
                <label><input type="radio" checked={overrideAction==='override'} onChange={()=>setOverrideAction('override')} /> Hepsini güncelle (override)</label><br/>
                <label><input type="radio" checked={overrideAction==='skip'} onChange={()=>setOverrideAction('skip')} /> Hepsini atla (skip)</label><br/>
                <label><input type="radio" checked={overrideAction==='onlynew'} onChange={()=>setOverrideAction('onlynew')} /> Sadece yenileri ekle</label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={()=>setShowOverrideModal(false)} className="btn-cancel">İptal</button>
              <button onClick={handleOverrideConfirm} className="btn-submit">Devam Et</button>
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </div>
  );  
};

export default CourseList;
