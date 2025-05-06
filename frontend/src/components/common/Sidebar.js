import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = ({ user }) => {
  const location = useLocation();
  // Kullanıcının admin yetkisi olup olmadığını kontrol et
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("admin");
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>SWE-SYS</h3>
        <p>{user?.role || 'User'}</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li className={isActive('/') ? 'active' : ''}>
            <Link to="/">
              <span className="icon">🏠</span>
              <span className="label">Dashboard</span>
            </Link>
          </li>
          <li className={isActive('/faculties') ? 'active' : ''}>
            <Link to="/faculties">
              <span className="icon">🏛️</span>
              <span className="label">Faculties & Programs</span>
            </Link>
          </li>
          <li className={isActive('/teachers') ? 'active' : ''}>
            <Link to="/teachers">
              <span className="icon">👥</span>
              <span className="label">Teachers</span>
            </Link>
          </li>
          <li className={isActive('/courses') ? 'active' : ''}>
            <Link to="/courses">
              <span className="icon">📚</span>
              <span className="label">Courses</span>
            </Link>
          </li>
          <li className={isActive('/classrooms') ? 'active' : ''}>
            <Link to="/classrooms">
              <span className="icon">🏫</span>
              <span className="label">Classrooms</span>
            </Link>
          </li>
          <li className={isActive('/schedules') ? 'active' : ''}>
            <Link to="/schedules">
              <span className="icon">📅</span>
              <span className="label">Schedules</span>
            </Link>
          </li>
          {isAdmin && (
            <li className={isActive('/scheduler') ? 'active' : ''}>
              <Link to="/scheduler">
                <span className="icon">⚙️</span>
                <span className="label">Scheduler</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <Link to="/settings">
          <span className="icon">⚙️</span>
          <span className="label">Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
