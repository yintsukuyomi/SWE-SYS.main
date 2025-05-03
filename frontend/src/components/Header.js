import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/">SWE-SYS</Link>
      </div>
      
      {user && (
        <nav className="header-nav">
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/teachers">Teachers</Link></li>
            <li><Link to="/schedules">Schedules</Link></li>
          </ul>
        </nav>
      )}
      
      <div className="header-actions">
        {user ? (
          <>
            <span className="username">Welcome, {user.username}</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
