import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClassroomById, updateClassroom } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/ClassroomForm.css';

const ClassroomEdit = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    type: '',
    faculty: '',
    department: ''
  });
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
    const fetchClassroom = async () => {
      try {
        const data = await getClassroomById(id, token);
        
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
          capacity: data.capacity || 30,
          type: data.type || 'Lecture Hall',
          faculty: facultyId || '',
          department: departmentId || ''
        });
        
        // Fakültenin bölümlerini hemen ayarla
        if (facultyId) {
          setDepartments(getDepartmentsByFaculty(facultyId));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching classroom:', err);
        setError('Derslik bilgileri yüklenemedi. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchClassroom();
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
      faculty: selectedFaculty ? selectedFaculty.name : originalData.faculty,
      department: selectedDepartment ? selectedDepartment.name : originalData.department
    };

    try {
      await updateClassroom(id, submissionData, token);
      navigate('/classrooms');
    } catch (err) {
      console.error('Error updating classroom:', err);
      setError(err.detail || 'Derslik güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Derslik bilgileri yükleniyor...</div>;

  return (
    <div className="classroom-form-container">
      <h2>Derslik Düzenle</h2>
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
            {loading ? 'Güncelleniyor...' : 'Derslik Güncelle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassroomEdit;
