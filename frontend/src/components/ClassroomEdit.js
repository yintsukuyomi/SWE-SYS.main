import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClassroomById, updateClassroom } from '../api';
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const data = await getClassroomById(id, token);
        setFormData({
          name: data.name || '',
          capacity: data.capacity || 30,
          type: data.type || 'Lecture Hall',
          faculty: data.faculty || '',
          department: data.department || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching classroom:', err);
        setError('Failed to load classroom data. Please try again.');
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [id, token]);

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

    try {
      await updateClassroom(id, formData, token);
      navigate('/classrooms');
    } catch (err) {
      console.error('Error updating classroom:', err);
      setError(err.detail || 'Failed to update classroom. Please try again.');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading classroom data...</div>;

  return (
    <div className="classroom-form-container">
      <h2>Edit Classroom</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="classroom-form">
        <div className="form-group">
          <label htmlFor="name">Classroom Name/Number</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="E.g., A101, Lab 3, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="capacity">Capacity</label>
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
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="Lecture Hall">Lecture Hall</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Seminar Room">Seminar Room</option>
            <option value="Computer Lab">Computer Lab</option>
            <option value="Conference Room">Conference Room</option>
            <option value="Studio">Studio</option>
            <option value="Auditorium">Auditorium</option>
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

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/classrooms')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Classroom'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassroomEdit;
