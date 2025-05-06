import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeacherById, updateTeacher } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/TeacherForm.css';

const TeacherEdit = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    department: '',
    working_days: '',
    working_hours: ''
  });
  
  // Gün ve saat seçimleri için state
  const [selectedDays, setSelectedDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false
  });
  
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00'
  });
  
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Veritabanından gelen fakülte ve bölüm adlarını ID'lere çevirmek için
  const [originalData, setOriginalData] = useState({
    faculty: '',
    department: ''
  });

  // Fakülte değiştiğinde ilgili bölümleri güncelle
  useEffect(() => {
    if (formData.faculty) {
      setDepartments(getDepartmentsByFaculty(formData.faculty));
      // Eğer seçilen fakülte değiştiyse ve mevcut bölüm bu fakültede yoksa, bölümü sıfırla
      if (!getDepartmentsByFaculty(formData.faculty).find(dept => dept.id === formData.department)) {
        setFormData(prev => ({ ...prev, department: '' }));
      }
    } else {
      setDepartments([]);
    }
  }, [formData.faculty]);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const data = await getTeacherById(id, token);
        
        // Veritabanından gelen fakülte ve bölüm adlarını sakla
        setOriginalData({
          faculty: data.faculty || '',
          department: data.department || ''
        });
        
        // Fakülte ve bölüm adlarından ID'leri bul
        const facultyId = findFacultyIdByName(data.faculty);
        const departmentsForFaculty = facultyId ? getDepartmentsByFaculty(facultyId) : [];
        const departmentId = findDepartmentIdByName(departmentsForFaculty, data.department);
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          faculty: facultyId || '',
          department: departmentId || '',
          working_days: data.working_days || '',
          working_hours: data.working_hours || ''
        });
        
        // Fakültenin bölümlerini hemen ayarla
        if (facultyId) {
          setDepartments(getDepartmentsByFaculty(facultyId));
        }

        // Çalışma günlerini parse et
        if (data.working_days) {
          const days = data.working_days.split(',');
          const dayState = {
            monday: days.includes('monday'),
            tuesday: days.includes('tuesday'),
            wednesday: days.includes('wednesday'),
            thursday: days.includes('thursday'),
            friday: days.includes('friday')
          };
          setSelectedDays(dayState);
        }

        // Çalışma saatlerini parse et
        if (data.working_hours && data.working_hours.includes('-')) {
          const [start, end] = data.working_hours.split('-');
          setWorkingHours({
            start: start.trim() || '09:00',
            end: end.trim() || '17:00'
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching teacher:', error);
        setError('Öğretmen bilgileri yüklenemedi. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id, token]);
  
  // Fakülte adından ID bulan yardımcı fonksiyon
  const findFacultyIdByName = (facultyName) => {
    const faculty = FACULTIES.find(f => f.name === facultyName);
    return faculty ? faculty.id : '';
  };
  
  // Bölüm adından ID bulan yardımcı fonksiyon
  const findDepartmentIdByName = (departments, departmentName) => {
    const department = departments.find(d => d.name === departmentName);
    return department ? department.id : '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDayChange = (e) => {
    const { name, checked } = e.target;
    setSelectedDays(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleHourChange = (e) => {
    const { name, value } = e.target;
    setWorkingHours(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Seçili günleri ve saatleri formData'ya ekleyelim
    const selectedDaysArray = Object.keys(selectedDays).filter(day => selectedDays[day]);
    
    if (selectedDaysArray.length === 0) {
      setError("En az bir çalışma günü seçmelisiniz.");
      return;
    }
    
    const workingDays = selectedDaysArray.join(',');
    const workingHoursFormat = `${workingHours.start}-${workingHours.end}`;
    
    // Seçilen fakülte ve bölümün adlarını al
    const selectedFaculty = FACULTIES.find(f => f.id === formData.faculty);
    const selectedDepartment = departments.find(d => d.id === formData.department);
    
    const updatedFormData = {
      ...formData,
      working_days: workingDays,
      working_hours: workingHoursFormat,
      // ID yerine adları gönderelim
      faculty: selectedFaculty ? selectedFaculty.name : originalData.faculty,
      department: selectedDepartment ? selectedDepartment.name : originalData.department
    };

    try {
      await updateTeacher(id, updatedFormData, token);
      navigate('/teachers');
    } catch (err) {
      console.error('Error updating teacher:', err);
      setError(err.detail || 'Öğretmen güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };
  
  const dayLabels = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma'
  };

  if (loading) return <div className="loading">Öğretmen bilgileri yükleniyor...</div>;

  return (
    <div className="teacher-form-container">
      <h2>Öğretmen Düzenle</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="teacher-form">
        <div className="form-group">
          <label htmlFor="name">Ad Soyad</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Öğretmenin tam adını girin"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">E-posta Adresi</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Öğretmenin e-posta adresini girin"
          />
        </div>

        <div className="form-group">
          <label htmlFor="faculty">Fakülte</label>
          <select
            id="faculty"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            required
          >
            <option value="">Fakülte seçin</option>
            {FACULTIES.map(faculty => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="department">Bölüm</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            disabled={!formData.faculty}
          >
            <option value="">Bölüm seçin</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group days-selection">
          <label>Çalışma Günleri</label>
          <div className="checkbox-group">
            {Object.keys(selectedDays).map(day => (
              <div key={day} className="checkbox-item">
                <input
                  type="checkbox"
                  id={day}
                  name={day}
                  checked={selectedDays[day]}
                  onChange={handleDayChange}
                />
                <label htmlFor={day}>{dayLabels[day]}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group hours-selection">
          <label>Çalışma Saatleri</label>
          <div className="hours-inputs">
            <div className="time-input">
              <label htmlFor="start">Başlangıç:</label>
              <input
                type="time"
                id="start"
                name="start"
                value={workingHours.start}
                onChange={handleHourChange}
                required
              />
            </div>
            <div className="time-input">
              <label htmlFor="end">Bitiş:</label>
              <input
                type="time"
                id="end"
                name="end"
                value={workingHours.end}
                onChange={handleHourChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/teachers')} className="btn-cancel">
            İptal
          </button>
          <button type="submit" className="btn-submit">
            Öğretmen Güncelle
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherEdit;
