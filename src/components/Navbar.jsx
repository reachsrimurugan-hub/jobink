import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ShieldAlert, BadgeCheck } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-1.5 focus:outline-none"
          onClick={() => setActiveTab && setActiveTab('home')}
        >
          <span className="font-bold text-xl tracking-tight text-primary flex items-center">
            WorkLink
          </span>
          {currentUser?.role && (
            <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded tracking-wide border border-slate-200 hidden xs:inline">
              {currentUser.role === 'admin' ? 'Admin' : currentUser.role}
            </span>
          )}
        </Link>

        {/* User Stats & Quick Actions */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <>
              {/* Verification Badge */}
              {currentUser.verified ? (
                <div className="flex items-center gap-0.5 text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded border border-green-200" title="Verified Profile">
                  <BadgeCheck size={14} className="fill-green-600 text-white" />
                  <span className="hidden xs:inline">Verified</span>
                </div>
              ) : currentUser.verificationStatus === 'pending' ? (
                <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200" title="Under Review">
                  <span className="hidden xs:inline">Pending Verification</span>
                  <span className="xs:hidden">Pending</span>
                </div>
              ) : currentUser.role && currentUser.role !== 'admin' ? (
                <div className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded border border-red-100" title="Needs Aadhaar Upload">
                  <span className="hidden xs:inline">Unverified</span>
                </div>
              ) : null}

              {/* Admin Portal Shortcut (Strict check for admin role only) */}
              {currentUser.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2.5 py-1 transition-colors"
                >
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* Welcome label */}
              <div className="hidden md:flex items-center gap-4 text-sm text-slate-600 mr-2">
                <span>Hello, <strong className="text-slate-800">{currentUser.name || 'User'}</strong></span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-2 rounded-lg border border-slate-200 transition-colors flex items-center justify-center touch-target"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
