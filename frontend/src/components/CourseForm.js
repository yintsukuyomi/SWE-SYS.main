import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse, getTeachers } from '../api';
import '../styles/CourseForm.css';

const CourseForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: '',
    faculty: '',
    department: '',
    level: 'Undergraduate',
    type: 'Core',
    category: '',
    semester: 'Fall',
    ects: 5,
    total_hours: 3,
    is_active: true
  });
  
  const [teachers, setTeachers] = useState([]);
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
        setError('Failed to load teachers. Please try again.');
      }
    };
    
    fetchTeachers();
  }, [token]);

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

    // teacher_id'nin sayısal olduğundan emin olalım
    const submissionData = {
      ...formData,
      teacher_id: parseInt(formData.teacher_id, 10)
    };

    try {
      await createCourse(submissionData, token);
      navigate('/courses');
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.detail || 'Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-form-container">
      <h2>Add New Course</h2>
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
          <input
            type="text"
            id="faculty"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            required
            placeholder="Enter faculty name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            placeholder="Enter department name"
          />
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
            {loading ? 'Adding...' : 'Add Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
