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
      <h1>PlanEdu'ya Hoş Geldiniz</h1>
      <p className="dashboard-subtitle">Eğitim Yönetimi Otomasyon Sistemi</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-number">{loading ? '...' : stats.teacherCount}</div>
          <div className="stat-label">Öğretmen</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-number">{loading ? '...' : stats.courseCount}</div>
          <div className="stat-label">Ders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-number">{loading ? '...' : stats.classroomCount}</div>
          <div className="stat-label">Derslik</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-number">{loading ? '...' : stats.scheduleCount}</div>
          <div className="stat-label">Planlanan Dersler</div>
        </div>
      </div>

      <h2>Hızlı Erişim</h2>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>👥 Öğretmenler</h3>
          <p>Öğretmen bilgilerini ve uygunluk durumlarını yönetin</p>
          <div className="card-actions">
            <Link to="/teachers" className="card-btn primary">Öğretmenleri Görüntüle</Link>
            <Link to="/teachers/new" className="card-btn secondary">Yeni Ekle</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>📚 Dersler</h3>
          <p>Ders kayıtlarını inceleyin ve yönetin</p>
          <div className="card-actions">
            <Link to="/courses" className="card-btn primary">Dersleri Görüntüle</Link>
            <Link to="/courses/new" className="card-btn secondary">Yeni Ekle</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>🏫 Derslikler</h3>
          <p>Derslik kaynaklarını görüntüleyin ve yönetin</p>
          <div className="card-actions">
            <Link to="/classrooms" className="card-btn primary">Derslikleri Görüntüle</Link>
            <Link to="/classrooms/new" className="card-btn secondary">Yeni Ekle</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>📅 Ders Programları</h3>
          <p>Ders programlarını görüntüleyin ve yönetin</p>
          <div className="card-actions">
            <Link to="/schedules" className="card-btn primary">Programları Görüntüle</Link>
            <Link to="/scheduler" className="card-btn secondary">Program Oluşturucu</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>🏛️ Fakülteler & Programlar</h3>
          <p>Fakülteleri, bölümleri ve akademik programları inceleyin</p>
          <div className="card-actions">
            <Link to="/faculties" className="card-btn primary">Fakülteleri Görüntüle</Link>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Son Aktiviteler</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon update">🔄</div>
            <div className="activity-content">
              <p><strong>CSE101</strong> dersinin programı güncellendi</p>
              <span className="activity-time">2 saat önce</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon add">➕</div>
            <div className="activity-content">
              <p><strong>Yapay Zekaya Giriş</strong> dersi eklendi</p>
              <span className="activity-time">Dün</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon notification">🔔</div>
            <div className="activity-content">
              <p>Gelecek hafta sonu sistem bakımı planlandı</p>
              <span className="activity-time">3 gün önce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
