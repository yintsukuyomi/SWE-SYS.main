import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTeachers, deleteTeacher, updateTeacher } from "../api";
import "../styles/ListView.css";
import "../styles/TeacherList.css";
import "../styles/CourseList.css";
import "../styles/SearchStyles.css";
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, [token]);

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers(token);
      setTeachers(data);

      const grouped = new Map();
      const faculties = new Set();

      data.forEach(teacher => {
        const facultyObj = FACULTIES.find(f => f.id === teacher.faculty);
        const facultyName = facultyObj ? facultyObj.name : teacher.faculty;
        
        faculties.add(facultyName);
        if (!grouped.has(facultyName)) {
          grouped.set(facultyName, new Map());
        }
        const deptMap = grouped.get(facultyName);
        if (!deptMap.has(teacher.department)) {
          deptMap.set(teacher.department, []);
        }
        deptMap.get(teacher.department).push(teacher);
      });

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
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setError("Failed to delete teacher. " + (error.detail || ""));
    }
  };

  const isAdmin = user?.role === "admin" || user?.permissions?.includes("admin");

  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment(null);
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
  };

  const handleBackToFaculties = () => {
    setSelectedFaculty(null);
    setSelectedDepartment(null);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
  };

  const filteredTeachers = (teacherList) => {
    let filtered = teacherList;
    if (searchTerm && selectedDepartment) {
      filtered = teacherList.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  };

  const filteredFaculties = () => {
    if (!searchTerm || selectedFaculty || selectedDepartment) 
      return facultyList.slice().sort((a, b) => a.localeCompare(b, 'tr'));
    return facultyList
      .filter(faculty => faculty.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'tr'));
  };

  const filteredDepartments = (departments) => {
    if (!searchTerm || selectedDepartment)
      return departments.slice().sort((a, b) => a.localeCompare(b, 'tr'));
    return departments
      .filter(department => department.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'tr'));
  };

  const toggleTeacherStatus = async (teacherId, isCurrentlyActive) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return;
  
      const updateData = {
        ...teacher,
        is_active: !isCurrentlyActive
      };
  
      await updateTeacher(teacherId, updateData, token);
      
      setTeachers(prevTeachers => 
        prevTeachers.map(t => 
          t.id === teacherId ? { ...t, is_active: !isCurrentlyActive } : t
        )
      );
  
      setGroupedTeachers(prevGrouped => {
        const newGrouped = { ...prevGrouped };
        Object.keys(newGrouped).forEach(faculty => {
          Object.keys(newGrouped[faculty]).forEach(department => {
            newGrouped[faculty][department] = newGrouped[faculty][department].map(t => 
              t.id === teacherId ? { ...t, is_active: !isCurrentlyActive } : t
            );
          });
        });
        return newGrouped;
      });
    } catch (error) {
      console.error("Error updating teacher status:", error);
      setError(error.response?.data?.detail || "Öğretmen durumu güncellenirken bir hata oluştu.");
    }
  };

  const renderFacultiesPage = () => {
    return (
      <div className="list-container">
        <div className="list-header">
          <div className="header-content">
            <h1>Öğretmenler</h1>
            <p className="list-subtitle">Fakülte ve bölümlere göre öğretmenleri görüntüleyin</p>
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
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties().map(faculty => {
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

  const renderDepartmentsPage = () => {
    const departments = Object.keys(groupedTeachers[selectedFaculty] || {});
    
    return (
      <div className="list-container">
        <div className="list-header">
          <div className="header-content">
            <h1>{selectedFaculty}</h1>
            <p className="list-subtitle">Bölümlere göre öğretmenleri görüntüleyin</p>
          </div>
          <div className="header-actions">
            <button className="back-button" onClick={handleBackToFaculties}>
              ← Fakültelere Dön
            </button>
            {isAdmin && (
              <Link to="/teachers/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Öğretmen Ekle
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
                <th>Öğretmen Sayısı</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments(departments).map(department => {
                const teachers = groupedTeachers[selectedFaculty][department];
                
                return (
                  <tr key={department}>
                    <td>{department}</td>
                    <td>{teachers.length}</td>
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

  const renderTeachersPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedTeachers[selectedFaculty] || 
        !groupedTeachers[selectedFaculty][selectedDepartment]) {
      return <div>Öğretmen bulunamadı</div>;
    }
    
    const departmentTeachers = groupedTeachers[selectedFaculty][selectedDepartment];
    
    return (
      <div className="teachers-page">
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
              <Link to="/teachers/new" className="add-button">
                <span className="btn-icon">+</span> Yeni Öğretmen Ekle
              </Link>
            )}
          </div>
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
        
        <div className="course-list">
          {filteredTeachers(departmentTeachers).map((teacher) => (
            <div className="course-item" key={teacher.id}>
              <div className="course-details">
                <div className="course-code-name">
                  <span className="course-code">{teacher.title}</span>
                  <span className="course-name">{teacher.name}</span>
                </div>
                <div className="course-meta-row">
                  <span className="teacher-email">{teacher.email}</span>
                  {isAdmin ? (
                    <span 
                      className={`status-badge ${teacher.is_active ? 'active' : 'inactive'} clickable`}
                      onClick={() => toggleTeacherStatus(teacher.id, teacher.is_active)}
                      title={teacher.is_active ? 'Pasif yap' : 'Aktif yap'}
                    >
                      {teacher.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  ) : (
                    <span className={`status-badge ${teacher.is_active ? 'active' : 'inactive'}`}>
                      {teacher.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="course-actions">
                  <Link to={`/teachers/edit/${teacher.id}`} className="btn-edit">
                    Düzenle
                  </Link>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(teacher.id, teacher.name)}
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
