import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCourse, getTeachers, getCourseById, updateCourse } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/CourseForm.css';
import { toast } from 'react-toastify';

const CourseForm = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: '',
    faculty: '',
    level: '',
    category: 'zorunlu',
    semester: '',
    ects: 0,
    is_active: true,
    sessions: [{ type: 'teorik', hours: 0 }],
    departments: [{ department: '', student_count: 0 }]
  });
  
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
    if (id) {
      fetchCourse();
    }
  }, [id]);

  useEffect(() => {
    if (formData.faculty) {
      setDepartments(getDepartmentsByFaculty(formData.faculty));
    } else {
      setDepartments([]);
    }
  }, [formData.faculty]);

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers(token);
      setTeachers(data);
    } catch (error) {
      setError('Öğretmenler yüklenirken hata oluştu');
    }
  };

  const fetchCourse = async () => {
    try {
      const data = await getCourseById(id, token);
      setFormData({
        ...data,
        sessions: data.sessions || [{ type: 'teorik', hours: 0 }],
        departments: data.departments || [{ department: '', student_count: 0 }]
      });
    } catch (error) {
      setError('Ders bilgileri yüklenirken hata oluştu');
      toast.error('Ders bilgileri yüklenirken hata oluştu');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    newSessions[index] = {
      ...newSessions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      sessions: newSessions
    }));
  };

  const handleDepartmentChange = (index, field, value) => {
    const newDepartments = [...formData.departments];
    newDepartments[index] = {
      ...newDepartments[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      departments: newDepartments
    }));
  };

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, { type: 'teorik', hours: 0 }]
    }));
  };

  const removeSession = (index) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index)
    }));
  };

  const addDepartment = () => {
    setFormData(prev => ({
      ...prev,
      departments: [...prev.departments, { department: '', student_count: 0 }]
    }));
  };

  const removeDepartment = (index) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await updateCourse(id, formData, token);
        toast.success("Ders başarıyla güncellendi.");
      } else {
        await createCourse(formData, token);
        toast.success("Ders başarıyla eklendi.");
      }
      navigate('/courses');
    } catch (error) {
      setError(error.message || 'Bir hata oluştu');
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{id ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Ders Adı</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
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

        <div className="departments-section">
          <h3>Bölümler</h3>
          {formData.departments.map((dept, index) => (
            <div key={index} className="department-row">
              <div className="form-group">
                <label htmlFor={`department-${index}`}>Bölüm</label>
                <select
                  id={`department-${index}`}
                  value={dept.department}
                  onChange={(e) => handleDepartmentChange(index, 'department', e.target.value)}
                  required
                  disabled={!formData.faculty}
                >
                  <option value="">Bölüm seçin</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={`student-count-${index}`}>Öğrenci Sayısı</label>
                <input
                  type="number"
                  id={`student-count-${index}`}
                  min="0"
                  value={dept.student_count}
                  onChange={(e) => handleDepartmentChange(index, 'student_count', parseInt(e.target.value))}
                  required
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeDepartment(index)}
                >
                  Bölümü Sil
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn-add"
            onClick={addDepartment}
          >
            Bölüm Ekle
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="level">Seviye</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
            required
          >
            <option value="">Seviye seçin</option>
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
            required
          >
            <option value="">Dönem seçin</option>
            <option value="Fall">Güz</option>
            <option value="Spring">Bahar</option>
            <option value="Summer">Yaz</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ects">AKTS</label>
          <input
            type="number"
            id="ects"
            name="ects"
            min="0"
            value={formData.ects}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange({ target: { name: 'is_active', value: e.target.checked } })}
            />
            Aktif
          </label>
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
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : (id ? 'Güncelle' : 'Kaydet')}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate('/courses')}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
