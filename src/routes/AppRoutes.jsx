import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

// Lazy load pages for dynamic code splitting
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const WorkerDashboard = lazy(() => import('../pages/WorkerDashboard'));
const EmployerDashboard = lazy(() => import('../pages/EmployerDashboard'));
const PostJobPage = lazy(() => import('../pages/PostJobPage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));

// Page loader fallback
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
    <div className="spinner mb-3"></div>
    <p className="text-slate-500 text-xs font-semibold">Loading WorkLink...</p>
  </div>
);

// Private Route Wrapper: Requires authenticated session
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role Route Wrapper: Redirects if user hasn't finished onboarding or has different role
const DashboardRoute = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  
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
      // Render a clean Access Denied page to avoid infinite redirect loop
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md shadow-sm flex flex-col items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="text-center w-full">
              <h2 className="text-lg font-bold text-slate-800">Access Denied</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your database profile is registered as <strong>admin</strong>, but your email or mobile number identifier is not authorized in the environment credentials.
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer w-full text-center mt-2 shadow-sm"
            >
              Sign Out & Sign In as regular user
            </button>
          </div>
        </div>
      );
    }
  }
  
  return <Navigate to="/register" replace />;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();
  const isLikelyLoggedIn = localStorage.getItem('jobink_loggedIn') === 'true';

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            loading && isLikelyLoggedIn ? (
              <PageLoader />
            ) : !loading && currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            loading && isLikelyLoggedIn ? (
              <PageLoader />
            ) : !loading && currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          } 
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
    </Suspense>
  );
};

export default AppRoutes;
