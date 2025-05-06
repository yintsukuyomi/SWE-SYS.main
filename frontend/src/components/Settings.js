import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api';
import '../styles/Settings.css';

const Settings = ({ token }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    notifications: localStorage.getItem('notifications') === 'true' || false,
    autoSave: localStorage.getItem('autoSave') === 'true' || true
  });
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Apply theme immediately when changed
    if (name === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
    
    // Reset saved status when settings change
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save settings to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString());
    });
    
    setSaved(true);
    
    // Reset saved notification after a delay
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  if (loading) return <div className="settings-loading">Loading settings...</div>;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-description">
          Customize your application preferences and appearance
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {saved && <div className="success-message">Settings saved successfully!</div>}
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h2>Appearance</h2>
          
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <div className="theme-selector">
              <div 
                className={`theme-option ${settings.theme === 'light' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'theme', value: 'light' } })}
              >
                <div className="theme-preview light-theme">
                  <div className="preview-header"></div>
                  <div className="preview-content"></div>
                </div>
                <span>Light</span>
              </div>
              <div 
                className={`theme-option ${settings.theme === 'dark' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'theme', value: 'dark' } })}
              >
                <div className="theme-preview dark-theme">
                  <div className="preview-header"></div>
                  <div className="preview-content"></div>
                </div>
                <span>Dark</span>
              </div>
              <div 
                className={`theme-option ${settings.theme === 'system' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'theme', value: 'system' } })}
              >
                <div className="theme-preview system-theme">
                  <div className="preview-header"></div>
                  <div className="preview-content"></div>
                </div>
                <span>System</span>
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="settings-section">
          <h2>Notifications</h2>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="notifications"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />
            <label htmlFor="notifications">Enable Notifications</label>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Editor</h2>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="autoSave"
              name="autoSave"
              checked={settings.autoSave}
              onChange={handleChange}
            />
            <label htmlFor="autoSave">Auto Save Changes</label>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Account Information</h2>
          
          <div className="account-info">
            <div className="account-info-item">
              <span className="info-label">Username:</span>
              <span className="info-value">{user?.username || 'N/A'}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">{user?.role || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-save">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
