import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCourse, getTeachers, getCourseById, updateCourse } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/CourseForm.css';

const CourseForm = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: '',
    faculty: '',
    department: '',
    level: '',
    category: 'zorunlu',
    semester: '',
    ects: 0,
    is_active: true,
    student_count: 0,
    sessions: [{ type: 'teorik', hours: 0 }]
  });
  
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Öğretmenleri yükle
        const teachersData = await getTeachers(token);
        setTeachers(teachersData);

        // Eğer düzenleme modundaysa, ders bilgilerini yükle
        if (id) {
          const courseData = await getCourseById(id, token);
          
          // Fakülte ve bölüm ID'lerini bul
          const facultyObj = FACULTIES.find(f => f.name === courseData.faculty);
          const departmentObj = getDepartmentsByFaculty(facultyObj?.id || '').find(d => d.name === courseData.department);
          
          setFormData({
            name: courseData.name,
            code: courseData.code,
            teacher_id: courseData.teacher_id,
            faculty: facultyObj?.id || '',
            department: departmentObj?.id || '',
            level: courseData.level,
            category: courseData.category,
            semester: courseData.semester,
            ects: courseData.ects,
            is_active: courseData.is_active,
            student_count: courseData.student_count,
            sessions: courseData.sessions.map(session => ({
              type: session.type,
              hours: session.hours
            }))
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Veriler yüklenemedi. Lütfen tekrar deneyin.');
      }
    };
    
    fetchData();
  }, [token, id]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // teacher_id için özel işlem yapalım
    if (name === 'teacher_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
    }));
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setFormData({ ...formData, sessions: newSessions });
  };

  const addSession = () => {
    setFormData({
      ...formData,
      sessions: [...formData.sessions, { type: 'teorik', hours: 0 }]
    });
  };

  const removeSession = (index) => {
    const newSessions = formData.sessions.filter((_, i) => i !== index);
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Seçilen fakülte ve bölümün adlarını al
    const selectedFaculty = FACULTIES.find(f => f.id === formData.faculty);
    const selectedDepartment = departments.find(d => d.id === formData.department);

    // teacher_id'nin sayısal olduğundan emin olalım
    const submissionData = {
      ...formData,
      teacher_id: parseInt(formData.teacher_id, 10),
      // ID yerine adları gönderelim
      faculty: selectedFaculty ? selectedFaculty.name : '',
      department: selectedDepartment ? selectedDepartment.name : '',
      sessions: formData.sessions.map(session => ({
        ...session,
        type: session.type === 'teorik' ? 'teorik' : 'lab'
      }))
    };

    try {
      if (id) {
        await updateCourse(id, submissionData, token);
      } else {
        await createCourse(submissionData, token);
      }
      navigate('/courses');
    } catch (err) {
      console.error('Error saving course:', err);
      setError(err.detail || 'Ders kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{id ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label htmlFor="name">Ders Adı</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ders adını girin"
          />
        </div>

        <div className="form-group">
          <label htmlFor="code">Ders Kodu</label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            placeholder="Örn: CS101"
          />
        </div>

        <div className="form-group">
          <label htmlFor="teacher_id">Öğretmen</label>
          <select
            id="teacher_id"
            name="teacher_id"
            value={formData.teacher_id}
            onChange={handleChange}
            required
          >
            <option value="">Öğretmen seçin</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
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

        <div className="form-group">
          <label htmlFor="level">Seviye</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
          >
            <option value="Preparatory Year">Hazırlık</option>
            <option value="Year 1">1. Sınıf</option>
            <option value="Year 2">2. Sınıf</option>
            <option value="Year 3">3. Sınıf</option>
            <option value="Year 4">4. Sınıf</option>
            <option value="Graduate">Yüksek Lisans</option>
            <option value="PhD">Doktora</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Ders Kategorisi</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="zorunlu">Zorunlu</option>
            <option value="secmeli">Seçmeli</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="semester">Dönem</label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
          >
            <option value="Fall">Güz</option>
            <option value="Spring">Bahar</option>
            <option value="Summer">Yaz</option>
            <option value="Winter">Kış</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ects">AKTS Kredisi</label>
          <input
            type="number"
            id="ects"
            name="ects"
            min="1"
            max="30"
            value={formData.ects}
            onChange={handleNumberChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="student_count">Öğrenci Sayısı</label>
          <input
            type="number"
            id="student_count"
            name="student_count"
            min="0"
            max="1000"
            value={formData.student_count}
            onChange={handleNumberChange}
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active">Aktif Ders</label>
        </div>

        <div className="sessions-section">
          <h3>Ders Oturumları</h3>
          {formData.sessions.map((session, index) => (
            <div key={index} className="session-row">
              <div className="form-group">
                <label htmlFor={`session-type-${index}`}>Oturum Türü</label>
                <select
                  id={`session-type-${index}`}
                  value={session.type}
                  onChange={(e) => handleSessionChange(index, 'type', e.target.value)}
                  required
                >
                  <option value="teorik">Teorik</option>
                  <option value="lab">Laboratuvar</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={`session-hours-${index}`}>Saat</label>
                <input
                  type="number"
                  id={`session-hours-${index}`}
                  min="1"
                  max="40"
                  value={session.hours}
                  onChange={(e) => handleSessionChange(index, 'hours', parseInt(e.target.value))}
                  required
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeSession(index)}
                >
                  Oturumu Sil
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn-add"
            onClick={addSession}
          >
            Oturum Ekle
          </button>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/courses')} className="btn-cancel">
            İptal
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : (id ? 'Güncelle' : 'Ders Ekle')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
