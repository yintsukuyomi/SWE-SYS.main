import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeacherById, updateTeacher } from '../api';
import '../styles/TeacherForm.css';

const TeacherEdit = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const data = await getTeacherById(id, token);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          faculty: data.faculty || '',
          department: data.department || '',
          working_days: data.working_days || '',
          working_hours: data.working_hours || ''
        });

        // Çalışma günlerini parse et
        if (data.working_days) {
          const days = data.working_days.split(',');
          const dayState = {
            monday: days.includes('monday'),
            tuesday: days.includes('tuesday'),
            wednesday: days.includes('wednesday'),
            thursday: days.includes('thursday'),
            friday: days.includes('friday')
          };
          setSelectedDays(dayState);
        }

        // Çalışma saatlerini parse et
        if (data.working_hours && data.working_hours.includes('-')) {
          const [start, end] = data.working_hours.split('-');
          setWorkingHours({
            start: start.trim() || '09:00',
            end: end.trim() || '17:00'
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching teacher:', error);
        setError('Failed to load teacher data. Please try again.');
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id, token]);

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
    setError(null);
    
    // Seçili günleri ve saatleri formData'ya ekleyelim
    const selectedDaysArray = Object.keys(selectedDays).filter(day => selectedDays[day]);
    
    if (selectedDaysArray.length === 0) {
      setError("En az bir çalışma günü seçmelisiniz.");
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
      await updateTeacher(id, updatedFormData, token);
      navigate('/teachers');
    } catch (err) {
      console.error('Error updating teacher:', err);
      setError(err.detail || 'Failed to update teacher. Please try again.');
    }
  };
  
  const dayLabels = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma'
  };

  if (loading) return <div className="loading">Loading teacher data...</div>;

  return (
    <div className="teacher-form-container">
      <h2>Edit Teacher</h2>
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
          <button type="submit" className="btn-submit">
            Update Teacher
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherEdit;
