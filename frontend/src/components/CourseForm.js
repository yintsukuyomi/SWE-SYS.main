import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse, getTeachers } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/CourseForm.css';

const CourseForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: '',
    faculty: '',
    department: '',
    level: 'Preparatory Year',
    type: 'Core',
    category: '',
    semester: 'Fall',
    ects: 5,
    total_hours: 3,
    is_active: true,
    student_count: 0  // Öğrenci sayısı alanı eklendi
  });
  
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Öğretmenleri yükle
    const fetchTeachers = async () => {
      try {
        const data = await getTeachers(token);
        setTeachers(data);
      } catch (err) {
        console.error('Error loading teachers:', err);
        setError('Öğretmenler yüklenemedi. Lütfen tekrar deneyin.');
      }
    };
    
    fetchTeachers();
  }, [token]);

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
      department: selectedDepartment ? selectedDepartment.name : ''
    };

    try {
      await createCourse(submissionData, token);
      navigate('/courses');
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.detail || 'Ders oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-form-container">
      <h2>Yeni Ders Ekle</h2>
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
          <label htmlFor="type">Tür</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="Core">Zorunlu</option>
            <option value="Elective">Seçmeli</option>
            <option value="Lab">Laboratuvar</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Kategori</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Örn: Bilgisayar Bilimleri"
          />
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
          <label htmlFor="total_hours">Toplam Saat (Haftalık)</label>
          <input
            type="number"
            id="total_hours"
            name="total_hours"
            min="1"
            max="40"
            value={formData.total_hours}
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

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/courses')} className="btn-cancel">
            İptal
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Ekleniyor...' : 'Ders Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
