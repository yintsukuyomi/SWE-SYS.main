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
import { toast } from 'react-toastify';

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
  const [pendingExcelData, setPendingExcelData] = useState(null);
  const [excelError, setExcelError] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);

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
      toast.success("Derslikler başarıyla yüklendi.");
    } catch (error) {
      let errorMessage = "Derslikler yüklenirken bir hata oluştu";
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
      toast.success("Derslik başarıyla silindi.");
      setDeleteConfirm({
        show: false,
        classroomId: null,
        classroomName: ''
      });
      fetchClassrooms();
    } catch (error) {
      let errorMessage = "Derslik silinemedi.";
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
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

  const handleExcelImport = async (data) => {
    const filteredData = data.filter(row =>
      Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '')
    );
    try {
      const typeMap = {
        'teorik': 'teorik',
        'lab': 'lab',
        'theoretical': 'teorik',
        'lecture': 'teorik',
        'laboratory': 'lab',
        'laboratuvar': 'lab'
      };
      for (const row of filteredData) {
        const rawType = (row['Tür'] || '').toLowerCase();
        const mappedType = typeMap[rawType];
        if (!mappedType) {
          setExcelError('Geçersiz derslik türü. Tür "teorik" veya "lab" olmalıdır.');
          return;
        }
        row['Tür'] = mappedType;
      }
      setPendingExcelData(filteredData);
      setShowExcelModal(true);
    } catch (err) {
      setExcelError(err.message || 'Derslikler içe aktarılırken bir hata oluştu.');
    }
  };

  const exportWithTemplate = async ({ data, headers, fileName, sheetName = 'Sheet', colWidth = 22 }) => {
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
      'Derslik Adı/Numarası',
      'Kapasite',
      'Tür',
      'Fakülte',
      'Bölüm',
      'Durum'
    ];
    const exportData = classrooms.map(classroom => ({
      'Derslik Adı/Numarası': classroom.name,
      'Kapasite': classroom.capacity,
      'Tür': classroom.type || classroom['Tür'] || '',
      'Fakülte': classroom.faculty,
      'Bölüm': classroom.department,
      'Durum': classroom.is_active ? 'Aktif' : 'Pasif'
    }));
    await exportWithTemplate({
      data: exportData,
      headers,
      fileName: 'derslikler',
      sheetName: 'Derslikler',
      colWidth: 22
    });
    toast.success('Derslikler başarıyla dışa aktarıldı.');
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
          <div className="no-data-message">Hiç derslik bulunamadı.</div>
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
              <h3>Excel'den Eklenecek Derslikler</h3>
              <button className="close-button" onClick={() => setShowExcelModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>{pendingExcelData.length}</strong> adet derslik eklenecek. Lütfen kontrol edin:
              </p>
              <div className="excel-preview-table-wrapper">
                <table className="excel-preview-table">
                  <thead>
                    <tr>
                      <th>Derslik Adı/Numarası</th>
                      <th>Kapasite</th>
                      <th>Tür</th>
                      <th>Fakülte</th>
                      <th>Bölüm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingExcelData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row['Derslik Adı/Numarası'] || row['name']}</td>
                        <td>{row['Kapasite'] || row['capacity']}</td>
                        <td>{row['Tür'] || row['type']}</td>
                        <td>{row['Fakülte'] || row['faculty']}</td>
                        <td>{row['Bölüm'] || row['department']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="warning-text">Bu işlem geri alınamaz. Onaylıyor musunuz?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowExcelModal(false)} className="btn-cancel">İptal</button>
              <button onClick={async () => {
                setShowExcelModal(false);
                try {
                  setLoading(true);
                  setExcelError(null);
                  toast.info('Çok sayıda kayıt ekleniyor, lütfen bekleyin...');
                  for (const row of pendingExcelData) {
                    const classroomData = {
                      name: row['Derslik Adı/Numarası'],
                      capacity: parseInt(row['Kapasite']),
                      type: (row['Tür'] || '').toLowerCase(),
                      faculty: row['Fakülte'],
                      department: row['Bölüm']
                    };
                    await createClassroom(classroomData, token);
                  }
                  toast.success('Derslikler başarıyla eklendi.');
                  fetchClassrooms();
                } catch (err) {
                  setExcelError(err.message || 'Derslikler eklenirken hata oluştu.');
                } finally {
                  setLoading(false);
                  setPendingExcelData(null);
                }
              }} className="btn-submit">Ekle</button>
            </div>
          </div>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

export default ClassroomList;
