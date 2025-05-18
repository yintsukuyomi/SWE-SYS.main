import React, { useState, useEffect } from "react";
import { login } from "../api";
import "../styles/Login.css";
import { toast } from 'react-toastify';
// Logo dosyası bulunamadığı için kaldırıldı
// import logo from "../assets/logo.png";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sayfa yüklendiğinde mevcut tema ayarını uygula
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const data = await login(username, password);
      onLogin(data.access_token);
      toast.success("Giriş başarılı!");
    } catch (err) {
      let errorMessage = (err.response && err.response.data && err.response.data.detail) || err.message || "Geçersiz kullanıcı adı veya şifre";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {/* Logo yerine metin logosu kullanılıyor */}
          <div className="text-logo">SWE-SYS</div>
          <h2>SWE-SYS Giriş</h2>
          <p className="login-subtitle">Eğitim Yönetiminde Yeni Nesil Otomasyon</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="Kullanıcı adınızı girin"
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Şifrenizi girin"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
        <div className="login-info">
          <p>Demo Kullanıcıları:</p>
          <div className="demo-credentials">
            <div className="credential">
              <span>Yönetici:</span>
              <code>admin / admin123</code>
            </div>
            <div className="credential">
              <span>Öğretmen:</span>
              <code>teacher / teacher123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
