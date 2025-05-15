import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTeachers, deleteTeacher, updateTeacher, createTeacher } from "../api";
import ExcelOperations from './ExcelOperations';
import PageHeader from './PageHeader';
import * as XLSX from 'xlsx';
import "../styles/ListView.css";
import "../styles/TeacherList.css";
import "../styles/CourseList.css";
import "../styles/SearchStyles.css";
import { FACULTIES } from '../constants/facultiesAndDepartments';
import ExcelJS from 'exceljs';
import { toast } from 'react-toastify';

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
  const [pendingExcelData, setPendingExcelData] = useState(null);
  const [excelError, setExcelError] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);

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
      toast.success("Öğretmenler başarıyla yüklendi.");
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Öğretmenler yüklenirken bir hata oluştu");
      toast.error("Öğretmenler yüklenirken bir hata oluştu");
    } finally {
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
      toast.success("Öğretmen başarıyla silindi.");
      setDeleteConfirm({
        show: false,
        teacherId: null,
        teacherName: ''
      });
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setError("Öğretmen silinemedi. " + (error.detail || ""));
      toast.error("Öğretmen silinemedi. " + (error.detail || ""));
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
      toast.success("Öğretmen durumu güncellendi.");
    } catch (error) {
      console.error("Error updating teacher status:", error);
      setError(error.response?.data?.detail || "Öğretmen durumu güncellenirken bir hata oluştu.");
      toast.error(error.response?.data?.detail || "Öğretmen durumu güncellenirken bir hata oluştu.");
    }
  };

  const handleExcelImport = async (data) => {
    try {
      // Saat aralığını slotlara bölen yardımcı fonksiyon
      function expandTimeRange(range) {
        if (!range) return [];
        if (!range.includes('-')) return [range.trim()];
        const [start, end] = range.split('-').map(s => s.trim());
        const slots = [];
        let [h, m] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        while (h < endH || (h === endH && m <= endM)) {
          slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
          m += 30;
          if (m >= 60) { h++; m = 0; }
          if (h > endH || (h === endH && m > endM)) break;
        }
        return slots;
      }
      // Saatleri slotlara bölen fonksiyon
      const parseHours = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return val.split(',').flatMap(s => expandTimeRange(s.trim()));
      };
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const name = (row['Ad'] || row['Ad Soyad'] || row['Name'] || row['Adı Soyadı'] || '').trim();
        const email = (row['E-posta'] || row['Eposta'] || row['E-Mail'] || row['Email'] || '').trim();
        const faculty = (row['Fakülte'] || row['Fakulte'] || row['Faculty'] || '').trim();
        const department = (row['Bölüm'] || row['Bolum'] || row['Department'] || '').trim();
        if (!name || !email || !faculty || !department) {
          setExcelError(`Satır ${i + 2}: Tüm alanların doldurulması zorunludur. (Ad, E-posta, Fakülte, Bölüm)`);
          return;
        }
        // Basit e-posta kontrolü
        if (!email.includes('@') || !email.includes('.')) {
          setExcelError(`Satır ${i + 2}: Geçersiz e-posta adresi: ${email}`);
          return;
        }
        row['Ad'] = name;
        row['E-posta'] = email;
        row['Fakülte'] = faculty;
        row['Bölüm'] = department;
        // Çalışma saatlerini slotlara böl
        row['Pazartesi'] = parseHours(row['Pazartesi']);
        row['Salı'] = parseHours(row['Salı']);
        row['Çarşamba'] = parseHours(row['Çarşamba']);
        row['Perşembe'] = parseHours(row['Perşembe']);
        row['Cuma'] = parseHours(row['Cuma']);
      }
      setPendingExcelData(data);
      setShowExcelModal(true);
    } catch (err) {
      setExcelError(err.message || 'Öğretmenler içe aktarılırken bir hata oluştu.');
    }
  };

  const formatWorkingHours = (hours) => {
    if (!hours) return '';
    if (Array.isArray(hours)) return hours.join(', ');
    if (typeof hours === 'string') return hours;
    return '';
  };

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Öğretmenler');
    
    // Add headers
    worksheet.addRow([
      'Ad Soyad',
      'E-posta',
      'Fakülte',
      'Bölüm',
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Durum'
    ]);
    
    // Add data
    teachers.forEach(teacher => {
      let wh = teacher.working_hours;
      if (typeof wh === 'string') {
        try {
          wh = JSON.parse(wh);
        } catch {
          wh = {};
        }
      }
      worksheet.addRow([
        teacher.name,
        teacher.email,
        teacher.faculty,
        teacher.department,
        formatWorkingHours(wh?.monday),
        formatWorkingHours(wh?.tuesday),
        formatWorkingHours(wh?.wednesday),
        formatWorkingHours(wh?.thursday),
        formatWorkingHours(wh?.friday),
        teacher.is_active ? 'Aktif' : 'Pasif'
      ]);
    });
    
    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ogretmenler.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Öğretmenler başarıyla dışa aktarıldı.");
  };

  const teacherTemplate = [
    {
      'Ad Soyad': 'Örnek Öğretmen',
      'E-posta': 'ornek@universite.edu.tr',
      'Fakülte': 'Mühendislik Fakültesi',
      'Bölüm': 'Bilgisayar Mühendisliği',
      'Pazartesi': '09:00-10:30, 13:00-14:30',
      'Salı': '10:30-12:00',
      'Çarşamba': '',
      'Perşembe': '',
      'Cuma': '',
      'Durum': 'Aktif'
    }
  ];

  const renderFacultiesPage = () => {
    return (
      <div className="list-container">
        <PageHeader
          title="Öğretmenler"
          subtitle="Fakülte ve bölümlere göre öğretmenleri görüntüleyin"
          isAdmin={isAdmin}
          addButtonText="Yeni Öğretmen Ekle"
          addButtonLink="/teachers/new"
          onImport={handleExcelImport}
          onExport={handleExcelExport}
          templateData={teacherTemplate}
          templateFileName="ogretmen_sablonu"
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
        <PageHeader
          title={selectedFaculty}
          subtitle="Bölümlere göre öğretmenleri görüntüleyin"
          isAdmin={isAdmin}
          addButtonText="Yeni Öğretmen Ekle"
          addButtonLink="/teachers/new"
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
        <PageHeader
          title={selectedDepartment}
          subtitle={selectedFaculty}
          isAdmin={isAdmin}
          addButtonText="Yeni Öğretmen Ekle"
          addButtonLink="/teachers/new"
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
          <PageHeader
            title="Öğretmenler"
            subtitle="Fakülte ve bölümlere göre öğretmenleri görüntüleyin"
            isAdmin={isAdmin}
            addButtonText="Yeni Öğretmen Ekle"
            addButtonLink="/teachers/new"
            onImport={handleExcelImport}
            onExport={handleExcelExport}
            templateData={teacherTemplate}
            templateFileName="ogretmen_sablonu"
          />
          <div className="no-data-message">Hiç öğretmen bulunamadı.</div>
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
              <h3>Excel'den Eklenecek Öğretmenler</h3>
              <button className="close-button" onClick={() => setShowExcelModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>{pendingExcelData.length}</strong> adet öğretmen eklenecek. Lütfen kontrol edin:
              </p>
              <p className="modal-info" style={{fontSize: '13px', color: '#555', marginBottom: '8px'}}>
                Çalışma saatlerini <b>aralık</b> olarak yazabilirsiniz (örn. <b>09:00-10:30, 13:00-14:30</b>). Birden fazla aralık için virgül kullanın.
              </p>
              <div className="excel-preview-table-wrapper">
                <table className="excel-preview-table">
                  <thead>
                    <tr>
                      <th>Ad Soyad</th>
                      <th>E-posta</th>
                      <th>Fakülte</th>
                      <th>Bölüm</th>
                      <th>Pazartesi</th>
                      <th>Salı</th>
                      <th>Çarşamba</th>
                      <th>Perşembe</th>
                      <th>Cuma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingExcelData.map((teacher, idx) => (
                      <tr key={idx}>
                        <td>{teacher['Ad'] || teacher['Ad Soyad'] || teacher['Name'] || teacher['Adı Soyadı']}</td>
                        <td>{teacher['E-posta'] || teacher['Eposta'] || teacher['E-Mail'] || teacher['Email']}</td>
                        <td>{teacher['Fakülte'] || teacher['Fakulte'] || teacher['Faculty']}</td>
                        <td>{teacher['Bölüm'] || teacher['Bolum'] || teacher['Department']}</td>
                        <td>{Array.isArray(teacher['Pazartesi']) ? teacher['Pazartesi'].join(', ') : teacher['Pazartesi']}</td>
                        <td>{Array.isArray(teacher['Salı']) ? teacher['Salı'].join(', ') : teacher['Salı']}</td>
                        <td>{Array.isArray(teacher['Çarşamba']) ? teacher['Çarşamba'].join(', ') : teacher['Çarşamba']}</td>
                        <td>{Array.isArray(teacher['Perşembe']) ? teacher['Perşembe'].join(', ') : teacher['Perşembe']}</td>
                        <td>{Array.isArray(teacher['Cuma']) ? teacher['Cuma'].join(', ') : teacher['Cuma']}</td>
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
                  for (const row of pendingExcelData) {
                    const parseHours = (val) => {
                      if (!val) return [];
                      if (Array.isArray(val)) return val;
                      return val.split(',').map(s => s.trim()).filter(Boolean);
                    };
                    const working_hours_obj = {
                      monday: parseHours(row['Pazartesi']),
                      tuesday: parseHours(row['Salı']),
                      wednesday: parseHours(row['Çarşamba']),
                      thursday: parseHours(row['Perşembe']),
                      friday: parseHours(row['Cuma'])
                    };
                    const teacherData = {
                      name: (row['Ad'] || row['Ad Soyad'] || row['Name'] || row['Adı Soyadı'] || '').trim(),
                      email: (row['E-posta'] || row['Eposta'] || row['E-Mail'] || row['Email'] || '').trim(),
                      faculty: (row['Fakülte'] || row['Fakulte'] || row['Faculty'] || '').trim(),
                      department: (row['Bölüm'] || row['Bolum'] || row['Department'] || '').trim(),
                      working_hours: JSON.stringify(working_hours_obj)
                    };
                    await createTeacher(teacherData, token);
                  }
                  toast.success('Öğretmenler başarıyla eklendi.');
                  fetchTeachers();
                } catch (err) {
                  setExcelError(err.message || 'Öğretmenler eklenirken hata oluştu.');
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

export default TeacherList;
