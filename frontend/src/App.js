import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/common/Sidebar";

// Teacher components
import TeacherList from "./components/TeacherList";
import TeacherForm from "./components/TeacherForm";
import TeacherEdit from "./components/TeacherEdit";

// Course components
import CourseList from "./components/CourseList";
import CourseForm from "./components/CourseForm";
import CourseEdit from "./components/CourseEdit";

// Classroom components
import ClassroomList from "./components/ClassroomList";
import ClassroomForm from "./components/ClassroomForm";
import ClassroomEdit from "./components/ClassroomEdit";

import ScheduleList from "./components/ScheduleList";
import { getCurrentUser } from "./api";
import "./App.css";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await getCurrentUser(token);
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user:", error);
          // Token may be expired, clear it
          handleLogout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  // Yetkilendirmeli Route bileşeni
  const PrivateRoute = ({ children }) => {
    if (loading) {
      return <div className="loading-container">Loading...</div>;
    }
    return token ? children : <Navigate to="/login" />;
  };

  if (loading && token) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {token && <Sidebar user={user} />}
        <div className={`main-content ${token ? 'with-sidebar' : ''}`}>
          {token && <Header user={user} onLogout={handleLogout} />}
          <div className="content-wrapper">
            <Routes>
              <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
              <Route path="/" element={<PrivateRoute><Dashboard token={token} /></PrivateRoute>} />
              
              {/* Teacher Routes */}
              <Route path="/teachers" element={<PrivateRoute><TeacherList token={token} /></PrivateRoute>} />
              <Route path="/teachers/new" element={<PrivateRoute><TeacherForm token={token} /></PrivateRoute>} />
              <Route path="/teachers/edit/:id" element={<PrivateRoute><TeacherEdit token={token} /></PrivateRoute>} />
              
              {/* Course Routes */}
              <Route path="/courses" element={<PrivateRoute><CourseList token={token} /></PrivateRoute>} />
              <Route path="/courses/new" element={<PrivateRoute><CourseForm token={token} /></PrivateRoute>} />
              <Route path="/courses/edit/:id" element={<PrivateRoute><CourseEdit token={token} /></PrivateRoute>} />
              
              {/* Classroom Routes */}
              <Route path="/classrooms" element={<PrivateRoute><ClassroomList token={token} /></PrivateRoute>} />
              <Route path="/classrooms/new" element={<PrivateRoute><ClassroomForm token={token} /></PrivateRoute>} />
              <Route path="/classrooms/edit/:id" element={<PrivateRoute><ClassroomEdit token={token} /></PrivateRoute>} />
              
              <Route path="/schedules" element={<PrivateRoute><ScheduleList token={token} /></PrivateRoute>} />
              {/* 404 Page */}
              <Route path="*" element={<div className="not-found">Page not found</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
