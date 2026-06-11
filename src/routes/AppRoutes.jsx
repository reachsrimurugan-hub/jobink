import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import Pages (will be created in subsequent steps)
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import WorkerDashboard from '../pages/WorkerDashboard';
import EmployerDashboard from '../pages/EmployerDashboard';
import PostJobPage from '../pages/PostJobPage';
import AdminDashboard from '../pages/AdminDashboard';

// Private Route Wrapper: Requires authenticated session
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role Route Wrapper: Redirects if user hasn't finished onboarding or has different role
const DashboardRoute = () => {
  const { currentUser, isAdmin } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // If role is not selected, redirect to registration onboarding
  if (!currentUser.role) {
    return <Navigate to="/register" replace />;
  }
  
  if (currentUser.role === 'worker') {
    return <WorkerDashboard />;
  }
  
  if (currentUser.role === 'employer') {
    return <EmployerDashboard />;
  }
  
  if (currentUser.role === 'admin') {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      // Role is admin in DB but identifier does not match!
      // Redirect to landing page to block access
      return <Navigate to="/" replace />;
    }
  }
  
  return <Navigate to="/register" replace />;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      
      {/* Onboarding On-demand Route */}
      <Route 
        path="/register" 
        element={
          <PrivateRoute>
            {currentUser?.role ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          </PrivateRoute>
        } 
      />
      
      {/* Dashboard Route (resolves dynamically based on role) */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <DashboardRoute />
          </PrivateRoute>
        } 
      />
      
      {/* Employer Only: Post Job */}
      <Route 
        path="/post-job" 
        element={
          <PrivateRoute>
            {currentUser?.role === 'employer' ? <PostJobPage /> : <Navigate to="/dashboard" replace />}
          </PrivateRoute>
        } 
      />
      
      {/* Admin Panel */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      
      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
