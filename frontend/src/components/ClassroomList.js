import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClassrooms, deleteClassroom, updateClassroom, createClassroom } from "../api";
import ExcelOperations from './ExcelOperations';
import PageHeader from './PageHeader';
import * as XLSX from 'xlsx';
import "../styles/ListView.css";
import "../styles/ClassroomList.css";
import "../styles/CourseList.css";
import "../styles/SearchStyles.css";
import { FACULTIES } from '../constants/facultiesAndDepartments';
import ExcelJS from 'exceljs';

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

      const grouped = new Map();
      const faculties = new Set();

      data.forEach(classroom => {
        const facultyObj = FACULTIES.find(f => f.id === classroom.faculty);
        const facultyName = facultyObj ? facultyObj.name : classroom.faculty;
        
        faculties.add(facultyName);
        if (!grouped.has(facultyName)) {
          grouped.set(facultyName, new Map());
        }
        const deptMap = grouped.get(facultyName);
        if (!deptMap.has(classroom.department)) {
          deptMap.set(classroom.department, []);
        }
        deptMap.get(classroom.department).push(classroom);
      });

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
      setError("Derslikler yüklenirken bir hata oluştu");
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
      fetchClassrooms();
    } catch (error) {
      console.error("Error deleting classroom:", error);
      setError("Failed to delete classroom. " + (error.detail || ""));
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

  const filteredClassrooms = (classroomList) => {
    let filtered = classroomList;
    if (searchTerm && selectedDepartment) {
      filtered = classroomList.filter(classroom =>
        classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classroom.type.toLowerCase().includes(searchTerm.toLowerCase())
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

  const toggleClassroomStatus = async (classroomId, isCurrentlyActive) => {
    try {
      const classroom = classrooms.find(c => c.id === classroomId);
      if (!classroom) return;
  
      const updateData = {
        ...classroom,
        is_active: !isCurrentlyActive
      };
  
      await updateClassroom(classroomId, updateData, token);
      
      setClassrooms(prevClassrooms => 
        prevClassrooms.map(c => 
          c.id === classroomId ? { ...c, is_active: !isCurrentlyActive } : c
        )
      );
  
      setGroupedClassrooms(prevGrouped => {
        const newGrouped = { ...prevGrouped };
        Object.keys(newGrouped).forEach(faculty => {
          Object.keys(newGrouped[faculty]).forEach(department => {
            newGrouped[faculty][department] = newGrouped[faculty][department].map(c => 
              c.id === classroomId ? { ...c, is_active: !isCurrentlyActive } : c
            );
          });
        });
        return newGrouped;
      });
    } catch (error) {
      console.error("Error updating classroom status:", error);
      setError(error.response?.data?.detail || "Derslik durumu güncellenirken bir hata oluştu.");
    }
  };

  const handleExcelImport = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate and process each row
      for (const row of data) {
        const classroomData = {
          name: row['Derslik Adı/Numarası'],
          capacity: parseInt(row['Kapasite']),
          type: row['Tür'],
          faculty: row['Fakülte'],
          department: row['Bölüm']
        };
        
        // Validate required fields
        if (!classroomData.name || !classroomData.capacity || !classroomData.type || 
            !classroomData.faculty || !classroomData.department) {
          throw new Error('Tüm alanların doldurulması zorunludur.');
        }
        
        // Validate type
        if (!['teorik', 'lab'].includes(classroomData.type.toLowerCase())) {
          throw new Error('Geçersiz derslik türü. Tür "teorik" veya "lab" olmalıdır.');
        }
        
        // Create classroom
        await createClassroom(classroomData, token);
      }
      
      // Refresh the list
      await fetchClassrooms();
    } catch (err) {
      console.error('Error importing classrooms:', err);
      setError(err.message || 'Derslikler içe aktarılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Derslikler');
    
    // Add headers
    worksheet.addRow([
      'Derslik Adı/Numarası',
      'Kapasite',
      'Tür',
      'Fakülte',
      'Bölüm',
      'Durum'
    ]);
    
    // Add data
    classrooms.forEach(classroom => {
      worksheet.addRow([
        classroom.name,
        classroom.capacity,
        classroom.type,
        classroom.faculty,
        classroom.department,
        classroom.is_active ? 'Aktif' : 'Pasif'
      ]);
    });
    
    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'derslikler.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const classroomTemplate = [
    {
      'Derslik Adı/Numarası': 'A101',
      'Kapasite': '30',
      'Tür': 'teorik',
      'Fakülte': 'Mühendislik Fakültesi',
      'Bölüm': 'Bilgisayar Mühendisliği'
    }
  ];

  const renderFacultiesPage = () => {
    return (
      <div className="list-container">
        <PageHeader
          title="Derslikler"
          subtitle="Fakülte ve bölümlere göre derslikleri görüntüleyin"
          isAdmin={isAdmin}
          addButtonText="Yeni Derslik Ekle"
          addButtonLink="/classrooms/new"
          onImport={handleExcelImport}
          onExport={handleExcelExport}
          templateData={classroomTemplate}
          templateFileName="derslik_sablonu"
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

  const renderDepartmentsPage = () => {
    const departments = Object.keys(groupedClassrooms[selectedFaculty] || {});
    
    return (
      <div className="list-container">
        <PageHeader
          title={selectedFaculty}
          subtitle="Bölümlere göre derslikleri görüntüleyin"
          isAdmin={isAdmin}
          addButtonText="Yeni Derslik Ekle"
          addButtonLink="/classrooms/new"
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

  const renderClassroomsPage = () => {
    if (!selectedFaculty || !selectedDepartment || 
        !groupedClassrooms[selectedFaculty] || 
        !groupedClassrooms[selectedFaculty][selectedDepartment]) {
      return <div>Derslik bulunamadı</div>;
    }
    
    const departmentClassrooms = groupedClassrooms[selectedFaculty][selectedDepartment];
    
    return (
      <div className="classrooms-page">
        <PageHeader
          title={selectedDepartment}
          subtitle={selectedFaculty}
          isAdmin={isAdmin}
          addButtonText="Yeni Derslik Ekle"
          addButtonLink="/classrooms/new"
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
        
        <div className="course-list">
          {filteredClassrooms(departmentClassrooms).map((classroom) => (
            <div className="course-item" key={classroom.id}>
              <div className="course-details">
                <div className="course-code-name">
                  <span className="course-code">{classroom.code}</span>
                  <span className="course-name">{classroom.name}</span>
                </div>
                <div className="course-meta-row">
                  <span className="classroom-type">{classroom.type}</span>
                  <span className="classroom-capacity">Kapasite: {classroom.capacity}</span>
                  {isAdmin ? (
                    <span 
                      className={`status-badge ${classroom.is_active ? 'active' : 'inactive'} clickable`}
                      onClick={() => toggleClassroomStatus(classroom.id, classroom.is_active)}
                      title={classroom.is_active ? 'Pasif yap' : 'Aktif yap'}
                    >
                      {classroom.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  ) : (
                    <span className={`status-badge ${classroom.is_active ? 'active' : 'inactive'}`}>
                      {classroom.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="course-actions">
                  <Link to={`/classrooms/edit/${classroom.id}`} className="btn-edit">
                    Düzenle
                  </Link>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(classroom.id, classroom.name)}
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
