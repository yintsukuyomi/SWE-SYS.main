import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStatistics } from "../api";
import "../styles/Dashboard.css";

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    teacherCount: 0,
    courseCount: 0,
    classroomCount: 0,
    scheduleCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      
      try {
        // API'den gerçek verileri al
        const data = await getStatistics(token);
        console.log("Statistics data received:", data); // Debug için log eklendi
        setStats(data);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setError(error.detail || "Failed to load statistics");
        setLoading(false);
        
        // API hatası durumunda varsayılan değerler gösterme
        setStats({
          teacherCount: 0,
          courseCount: 0,
          classroomCount: 0,
          scheduleCount: 0
        });
      }
    };
    
    fetchStats();
    
    // Sayfa yüklendiğinde veriyi çekiyoruz, sonraki istekler için temizleyici fonksiyon
    const intervalId = setInterval(fetchStats, 60000); // Her 60 saniyede bir güncelleyelim
    
    return () => {
      clearInterval(intervalId); // React component unmount olduğunda interval'i temizle
    };
  }, [token]); // Sadece token değiştiğinde effect'i çalıştır

  return (
    <div className="dashboard">
      <h1>Welcome to SWE-SYS</h1>
      <p className="dashboard-subtitle">Education Management Automation System</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-number">{loading ? '...' : stats.teacherCount}</div>
          <div className="stat-label">Teachers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-number">{loading ? '...' : stats.courseCount}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-number">{loading ? '...' : stats.classroomCount}</div>
          <div className="stat-label">Classrooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-number">{loading ? '...' : stats.scheduleCount}</div>
          <div className="stat-label">Scheduled Classes</div>
        </div>
      </div>

      <h2>Quick Access</h2>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>👥 Teachers</h3>
          <p>Manage teacher information and availability</p>
          <div className="card-actions">
            <Link to="/teachers" className="card-btn primary">View Teachers</Link>
            <Link to="/teachers/new" className="card-btn secondary">Add New</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>📚 Courses</h3>
          <p>Browse and manage course offerings</p>
          <div className="card-actions">
            <Link to="/courses" className="card-btn primary">View Courses</Link>
            <Link to="/courses/new" className="card-btn secondary">Add New</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>🏫 Classrooms</h3>
          <p>View and manage classroom resources</p>
          <div className="card-actions">
            <Link to="/classrooms" className="card-btn primary">View Classrooms</Link>
            <Link to="/classrooms/new" className="card-btn secondary">Add New</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>📅 Schedules</h3>
          <p>View and manage class schedules</p>
          <div className="card-actions">
            <Link to="/schedules" className="card-btn primary">View Schedules</Link>
            <Link to="/scheduler" className="card-btn secondary">Scheduler</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>🏛️ Faculties & Programs</h3>
          <p>Browse faculties, departments and academic programs</p>
          <div className="card-actions">
            <Link to="/faculties" className="card-btn primary">View Faculties</Link>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon update">🔄</div>
            <div className="activity-content">
              <p>Schedule for <strong>CSE101</strong> was updated</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon add">➕</div>
            <div className="activity-content">
              <p>New course <strong>Introduction to AI</strong> was added</p>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon notification">🔔</div>
            <div className="activity-content">
              <p>System maintenance scheduled for next weekend</p>
              <span className="activity-time">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
