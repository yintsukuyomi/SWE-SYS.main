import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeacherById, updateTeacher } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/TeacherForm.css';
import { toast } from 'react-toastify';

const TeacherEdit = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    department: '',
    working_hours: ''
  });
  
  // Çalışma saatleri için state
  const [timeSlots, setTimeSlots] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Saat dilimlerini oluştur
  const initializeTimeSlots = () => {
    const slots = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const hours = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30'
    ];
    days.forEach(day => {
      slots[day] = {};
      hours.forEach(hour => {
        slots[day][hour] = false;
      });
    });
    return slots;
  };

  // Öğretmen verilerini yükle
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacher = await getTeacherById(id, token);
        console.log('Fetched teacher data:', teacher);
        
        // Fakülte ve bölüm ID'lerini bul
        const facultyObj = FACULTIES.find(f => f.name === teacher.faculty);
        console.log('Found faculty object:', facultyObj);
        
        const departmentObj = facultyObj ? 
          getDepartmentsByFaculty(facultyObj.id).find(d => d.name === teacher.department) : null;
        console.log('Found department object:', departmentObj);
        
        // Çalışma saatlerini parse et
        let workingHours = {};
        try {
          if (teacher.working_hours) {
            console.log('Raw working hours:', teacher.working_hours);
            workingHours = JSON.parse(teacher.working_hours);
            console.log('Parsed working hours:', workingHours);
          }
        } catch (e) {
          console.error('Error parsing working hours:', e);
        }
        
        // TimeSlots'u güncelle
        const updatedTimeSlots = initializeTimeSlots();
        Object.keys(workingHours).forEach(day => {
          if (workingHours[day] && Array.isArray(workingHours[day])) {
            workingHours[day].forEach(hour => {
              if (updatedTimeSlots[day]) {
                updatedTimeSlots[day][hour] = true;
              }
            });
          }
        });
        console.log('Updated time slots:', updatedTimeSlots);
        
        setTimeSlots(updatedTimeSlots);
        setFormData({
          name: teacher.name,
          email: teacher.email,
          faculty: facultyObj ? facultyObj.id : '',
          department: departmentObj ? departmentObj.id : '',
          working_hours: teacher.working_hours
        });
        
        if (facultyObj) {
          setDepartments(getDepartmentsByFaculty(facultyObj.id));
        }
      } catch (err) {
        console.error('Error fetching teacher:', err);
        setError('Öğretmen bilgileri yüklenemedi. Lütfen tekrar deneyin.');
        toast.error('Öğretmen bilgileri yüklenemedi. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id, token]);

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
      await updateTeacher(id, updatedFormData, token);
      toast.success("Öğretmen başarıyla güncellendi.");
      navigate('/teachers');
    } catch (error) {
      setError(error.detail || 'Öğretmen güncellenirken bir hata oluştu.');
      toast.error(error.detail || 'Öğretmen güncellenirken bir hata oluştu.');
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

  if (!timeSlots) {
    return <div>Yükleniyor...</div>;
  }

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
            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherEdit;
