import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AccessDenied.css';

const AccessDenied = () => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">🔒</div>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p>Please contact an administrator if you believe this is an error.</p>
        <Link to="/" className="back-link">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default AccessDenied;
