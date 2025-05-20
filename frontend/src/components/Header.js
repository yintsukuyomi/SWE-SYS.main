import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-logo">
        <a href="/">PlanEdu</a>
      </div>
      
      {user && (
        <nav className="header-nav">
          <ul>
            <li><Link to="/">Ana Sayfa</Link></li>
            <li><Link to="/faculties">Fakülteler ve Bölümler</Link></li>
            <li><Link to="/schedules">Ders Programları</Link></li>
          </ul>
        </nav>
      )}
      
      <div className="header-actions">
        {user ? (
          <>
            <span className="username">Merhaba, {user.username}</span>
            <button onClick={onLogout} className="logout-button">Çıkış</button>
          </>
        ) : (
          <Link to="/login">Giriş</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
