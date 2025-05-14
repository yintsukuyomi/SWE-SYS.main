import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClassroom } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/ClassroomForm.css';

const ClassroomForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    capacity: 30,
    type: 'teorik',
    faculty: '',
    department: ''
  });
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    const submissionData = {
      ...formData,
      // ID yerine adları gönderelim
      faculty: selectedFaculty ? selectedFaculty.name : '',
      department: selectedDepartment ? selectedDepartment.name : ''
    };

    try {
      await createClassroom(submissionData, token);
      navigate('/classrooms');
    } catch (err) {
      console.error('Error creating classroom:', err);
      setError(err.detail || 'Derslik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="classroom-form-container">
      <h2>Yeni Derslik Ekle</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="classroom-form">
        <div className="form-group">
          <label htmlFor="name">Derslik Adı/Numarası</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Örn: A101, Lab 3, vb."
          />
        </div>

        <div className="form-group">
          <label htmlFor="capacity">Kapasite</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            min="1"
            max="500"
            value={formData.capacity}
            onChange={handleNumberChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Tür</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="teorik">Teorik</option>
            <option value="lab">Laboratuvar</option>
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

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/classrooms')} className="btn-cancel">
            İptal
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Ekleniyor...' : 'Derslik Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassroomForm;
