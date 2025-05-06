import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourseById, updateCourse, getTeachers } from '../api';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import '../styles/CourseForm.css';

const CourseEdit = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: '',
    faculty: '',
    department: '',
    level: '',
    type: '',
    category: '',
    semester: '',
    ects: 0,
    total_hours: 0,
    is_active: true,
    student_count: 0  // Öğrenci sayısı alanı eklendi
  });
  
  const [teachers, setTeachers] = useState([]);
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
    const fetchData = async () => {
      try {
        // Ders verilerini ve öğretmenleri yükle
        const [courseData, teachersData] = await Promise.all([
          getCourseById(id, token),
          getTeachers(token)
        ]);
        
        // Veritabanından gelen fakülte ve bölüm adlarını sakla
        setOriginalData({
          faculty: courseData.faculty || '',
          department: courseData.department || ''
        });
        
        // Fakülte ve bölüm adlarından ID'leri bul
        const facultyId = findFacultyIdByName(courseData.faculty);
        const departmentsForFaculty = facultyId ? getDepartmentsByFaculty(facultyId) : [];
        const departmentId = findDepartmentIdByName(departmentsForFaculty, courseData.department);
        
        setFormData({
          name: courseData.name || '',
          code: courseData.code || '',
          teacher_id: courseData.teacher_id || '',
          faculty: facultyId || '',
          department: departmentId || '',
          level: courseData.level || 'Preparatory Year',
          type: courseData.type || 'Core',
          category: courseData.category || '',
          semester: courseData.semester || 'Fall',
          ects: courseData.ects || 5,
          total_hours: courseData.total_hours || 3,
          is_active: courseData.is_active !== undefined ? courseData.is_active : true,
          student_count: courseData.student_count || 0  // Öğrenci sayısını alıyoruz
        });
        
        // Fakültenin bölümlerini hemen ayarla
        if (facultyId) {
          setDepartments(getDepartmentsByFaculty(facultyId));
        }
        
        setTeachers(teachersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load course data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
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
      faculty: selectedFaculty ? selectedFaculty.name : originalData.faculty,
      department: selectedDepartment ? selectedDepartment.name : originalData.department
    };

    try {
      await updateCourse(id, submissionData, token);
      navigate('/courses');
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err.detail || 'Failed to update course. Please try again.');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading course data...</div>;

  return (
    <div className="course-form-container">
      <h2>Edit Course</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label htmlFor="name">Course Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter course name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="code">Course Code</label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            placeholder="E.g., CS101"
          />
        </div>

        <div className="form-group">
          <label htmlFor="teacher_id">Teacher</label>
          <select
            id="teacher_id"
            name="teacher_id"
            value={formData.teacher_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a teacher</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="faculty">Faculty</label>
          <select
            id="faculty"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            required
          >
            <option value="">Select a faculty</option>
            {FACULTIES.map(faculty => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            disabled={!formData.faculty}
          >
            <option value="">Select a department</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="level">Level</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
          >
            <option value="Preparatory Year">Preparatory Year</option>
            <option value="Year 1">Year 1</option>
            <option value="Year 2">Year 2</option>
            <option value="Year 3">Year 3</option>
            <option value="Year 4">Year 4</option>
            <option value="Graduate">Graduate</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="Core">Core</option>
            <option value="Elective">Elective</option>
            <option value="Lab">Lab</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="E.g., Computer Science"
          />
        </div>

        <div className="form-group">
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
          >
            <option value="Fall">Fall</option>
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ects">ECTS Credits</label>
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
          <label htmlFor="total_hours">Total Hours (Weekly)</label>
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
          <label htmlFor="student_count">Student Count</label>
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
          <label htmlFor="is_active">Active Course</label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/courses')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseEdit;
