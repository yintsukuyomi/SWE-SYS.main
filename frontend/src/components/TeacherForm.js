import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeacher } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/TeacherForm.css';

const TeacherForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    department: '',
    working_hours: ''
  });
  
  // Çalışma saatleri için state
  const [timeSlots, setTimeSlots] = useState({});
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Saat dilimlerini oluştur
  useEffect(() => {
    const slots = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    days.forEach(day => {
      slots[day] = {};
      hours.forEach(hour => {
        slots[day][hour] = false;
      });
    });
    
    setTimeSlots(slots);
  }, []);

  // Fakülte değiştiğinde ilgili bölümleri güncelle
  useEffect(() => {
    if (formData.faculty) {
      setDepartments(getDepartmentsByFaculty(formData.faculty));
      if (!getDepartmentsByFaculty(formData.faculty).find(dept => dept.id === formData.department)) {
        setFormData(prev => ({ ...prev, department: '' }));
      }
    } else {
      setDepartments([]);
    }
  }, [formData.faculty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTimeSlotChange = (day, hour) => {
    setTimeSlots(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: !prev[day][hour]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Seçili saatleri formData'ya ekleyelim
    const workingHours = {};
    Object.keys(timeSlots).forEach(day => {
      const selectedHours = Object.entries(timeSlots[day])
        .filter(([_, selected]) => selected)
        .map(([hour]) => hour);
      
      if (selectedHours.length > 0) {
        workingHours[day] = selectedHours;
      }
    });
    
    if (Object.keys(workingHours).length === 0) {
      setError("En az bir çalışma saati seçmelisiniz.");
      setLoading(false);
      return;
    }
    
    // Seçilen fakülte ve bölümün adlarını al
    const selectedFaculty = FACULTIES.find(f => f.id === formData.faculty);
    const selectedDepartment = departments.find(d => d.id === formData.department);
    
    const updatedFormData = {
      ...formData,
      working_hours: JSON.stringify(workingHours),
      // ID yerine adları gönderelim
      faculty: selectedFaculty ? selectedFaculty.name : '',
      department: selectedDepartment ? selectedDepartment.name : ''
    };

    try {
      await createTeacher(updatedFormData, token);
      navigate('/teachers');
    } catch (err) {
      console.error('Error creating teacher:', err);
      setError(err.detail || 'Öğretmen oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  const dayLabels = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma'
  };

  return (
    <div className="teacher-form-container">
      <h2>Yeni Öğretmen Ekle</h2>
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

        <div className="form-group working-hours-table">
          <label>Çalışma Saatleri</label>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Saat</th>
                  {Object.keys(dayLabels).map(day => (
                    <th key={day}>{dayLabels[day]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(timeSlots.monday || {}).map(hour => (
                  <tr key={hour}>
                    <td>{hour}</td>
                    {Object.keys(dayLabels).map(day => (
                      <td key={`${day}-${hour}`}>
                        <input
                          type="checkbox"
                          checked={timeSlots[day]?.[hour] || false}
                          onChange={() => handleTimeSlotChange(day, hour)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/teachers')} className="btn-cancel">
            İptal
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Öğretmen Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
