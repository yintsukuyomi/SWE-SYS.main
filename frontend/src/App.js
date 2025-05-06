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
import Scheduler from "./components/Scheduler";
import { getCurrentUser } from "./api";
import "./App.css";

// Faculty and Department components
import FacultyList from "./components/FacultyList";
import DepartmentList from "./components/DepartmentList";
import ProgramList from "./components/ProgramList";

import Settings from "./components/Settings";
import AdminRoute from "./components/common/AdminRoute";
import AccessDenied from "./components/AccessDenied";

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
      return <div className="loading-container">Yükleniyor...</div>;
    }
    return token ? children : <Navigate to="/login" />;
  };

  if (loading && token) {
    return <div className="loading-container">Yükleniyor...</div>;
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
              
              {/* Access Denied Route */}
              <Route path="/access-denied" element={<PrivateRoute><AccessDenied /></PrivateRoute>} />
              
              {/* Settings Route (Admin Only) */}
              <Route path="/settings" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <Settings token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              
              {/* Faculty and Department Routes */}
              <Route path="/faculties" element={<PrivateRoute><FacultyList /></PrivateRoute>} />
              <Route path="/faculties/:facultyId" element={<PrivateRoute><DepartmentList /></PrivateRoute>} />
              <Route path="/faculties/:facultyId/departments/:departmentId" element={<PrivateRoute><ProgramList token={token} /></PrivateRoute>} />
              
              {/* Admin Only Routes */}
              <Route path="/scheduler" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <Scheduler token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              
              {/* Teacher Routes - Limited Write Access */}
              <Route path="/teachers" element={<PrivateRoute><TeacherList token={token} user={user} /></PrivateRoute>} />
              <Route path="/teachers/new" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <TeacherForm token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              <Route path="/teachers/edit/:id" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <TeacherEdit token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              
              {/* Course Routes - Admin için tam yetkili, teacher için sadece görüntüleme */}
              <Route path="/courses" element={<PrivateRoute><CourseList token={token} user={user} /></PrivateRoute>} />
              <Route path="/courses/new" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <CourseForm token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              <Route path="/courses/edit/:id" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <CourseEdit token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              
              {/* Classroom Routes - Admin Only */}
              <Route path="/classrooms" element={<PrivateRoute><ClassroomList token={token} user={user} /></PrivateRoute>} />
              <Route path="/classrooms/new" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <ClassroomForm token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              <Route path="/classrooms/edit/:id" element={
                <PrivateRoute>
                  <AdminRoute user={user}>
                    <ClassroomEdit token={token} />
                  </AdminRoute>
                </PrivateRoute>
              } />
              
              {/* Schedule Routes - Read for all */}
              <Route path="/schedules" element={<PrivateRoute><ScheduleList token={token} user={user} /></PrivateRoute>} />
              
              {/* 404 Page */}
              <Route path="*" element={<div className="not-found">Sayfa bulunamadı</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
