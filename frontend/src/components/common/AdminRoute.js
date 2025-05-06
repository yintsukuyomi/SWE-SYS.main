import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ user, children }) => {
  // Admin yetkisi kontrolü
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("admin");
  
  if (!isAdmin) {
    return <Navigate to="/access-denied" />;
  }
  
  return children;
};

export default AdminRoute;
