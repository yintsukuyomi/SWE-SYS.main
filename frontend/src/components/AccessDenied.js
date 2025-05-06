import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AccessDenied.css';

const AccessDenied = () => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">🚫</div>
        <h1>Erişim Reddedildi</h1>
        <p>Bu sayfayı görüntülemek için yeterli yetkiye sahip değilsiniz.</p>
        <p>Lütfen yönetici ile iletişime geçin veya ana sayfaya dönün.</p>
        <Link to="/" className="home-button">Ana Sayfaya Dön</Link>
      </div>
    </div>
  );
};

export default AccessDenied;
