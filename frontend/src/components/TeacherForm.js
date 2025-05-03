import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeacher } from '../api';
import '../styles/TeacherForm.css';

const TeacherForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    department: '',
    working_days: '',
    working_hours: ''
  });
  
  // Gün ve saat seçimleri için state
  const [selectedDays, setSelectedDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false
  });
  
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00'
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDayChange = (e) => {
    const { name, checked } = e.target;
    setSelectedDays(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleHourChange = (e) => {
    const { name, value } = e.target;
    setWorkingHours(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Seçili günleri ve saatleri formData'ya ekleyelim
    const selectedDaysArray = Object.keys(selectedDays).filter(day => selectedDays[day]);
    
    if (selectedDaysArray.length === 0) {
      setError("En az bir çalışma günü seçmelisiniz.");
      setLoading(false);
      return;
    }
    
    const workingDays = selectedDaysArray.join(',');
    const workingHoursFormat = `${workingHours.start}-${workingHours.end}`;
    
    const updatedFormData = {
      ...formData,
      working_days: workingDays,
      working_hours: workingHoursFormat
    };

    try {
      await createTeacher(updatedFormData, token);
      navigate('/teachers');
    } catch (err) {
      console.error('Error creating teacher:', err);
      setError(err.detail || 'Failed to create teacher. Please try again.');
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
      <h2>Add New Teacher</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="teacher-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter teacher's full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter teacher's email address"
          />
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

        <div className="form-group days-selection">
          <label>Working Days</label>
          <div className="checkbox-group">
            {Object.keys(selectedDays).map(day => (
              <div key={day} className="checkbox-item">
                <input
                  type="checkbox"
                  id={day}
                  name={day}
                  checked={selectedDays[day]}
                  onChange={handleDayChange}
                />
                <label htmlFor={day}>{dayLabels[day]}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group hours-selection">
          <label>Working Hours</label>
          <div className="hours-inputs">
            <div className="time-input">
              <label htmlFor="start">Start:</label>
              <input
                type="time"
                id="start"
                name="start"
                value={workingHours.start}
                onChange={handleHourChange}
                required
              />
            </div>
            <div className="time-input">
              <label htmlFor="end">End:</label>
              <input
                type="time"
                id="end"
                name="end"
                value={workingHours.end}
                onChange={handleHourChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/teachers')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
