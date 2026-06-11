import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ShieldAlert, BadgeCheck } from 'lucide-react';
import { notificationService } from '../services/db';
import { useTranslation } from 'react-i18next';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout, updateProfile, startTransition, endTransition, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!currentUser || isAdmin) return;
    const unsubscribe = notificationService.getUserNotifications(currentUser.uid, (data) => {
      const count = data.filter(n => !n.read).length;
      setUnreadCount(count);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser, isAdmin]);

  const handleLogout = async () => {
    try {
      startTransition();
      await logout();
      navigate('/login');
      setTimeout(() => {
        endTransition();
      }, 500);
    } catch (err) {
      console.error('Logout error', err);
      endTransition();
    }
  };

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    startTransition();
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    if (currentUser) {
      try {
        await updateProfile({ language: newLang });
      } catch (err) {
        console.error('Failed to sync language to profile:', err);
      }
    }
    setTimeout(() => {
      endTransition();
    }, 600);
  };

  const tabs = currentUser?.role === 'worker' ? [
    { id: 'home', label: t('feed') },
    { id: 'applications', label: t('applied') },
    { id: 'notifications', label: t('alerts') },
    { id: 'profile', label: t('profile') }
  ] : currentUser?.role === 'employer' ? [
    { id: 'home', label: t('overview') },
    { id: 'jobs', label: t('myPosts') },
    { id: 'notifications', label: t('alerts') },
    { id: 'profile', label: t('profile') }
  ] : [];

  const handleTabClick = (tabId) => {
    if (activeTab === tabId) return;
    startTransition();
    if (setActiveTab) {
      setActiveTab(tabId);
    } else {
      navigate('/dashboard', { state: { defaultTab: tabId } });
    }
    setTimeout(() => {
      endTransition();
    }, 450);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-1.5 focus:outline-none"
          onClick={() => handleTabClick('home')}
        >
          <span className="font-bold text-xl tracking-tight text-primary flex items-center">
            Jobink
          </span>
          {currentUser?.role && (
            <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded tracking-wide border border-slate-200 hidden xs:inline">
              {isAdmin ? 'Admin' : (currentUser.role === 'worker' ? t('workerDashboard') : t('employerDashboard'))}
            </span>
          )}
        </Link>

        {/* Desktop Navigation links */}
        {currentUser?.role && !isAdmin && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasBadge = tab.id === 'notifications' && unreadCount > 0;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-white text-primary shadow-sm border border-slate-200/40' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  {hasBadge && (
                    <span className="bg-red-500 text-white font-extrabold text-[9px] rounded-full w-4 h-4 flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* User Stats & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={i18n.language ? i18n.language.split('-')[0] : 'en'}
            onChange={handleLanguageChange}
            className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-slate-100 transition-colors mr-1 touch-target"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>

          {currentUser && (
            <>
              {/* Verification Badge */}
              {currentUser.verified ? (
                <div className="flex items-center gap-0.5 text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded border border-green-200" title="Verified Profile">
                  <BadgeCheck size={14} className="fill-green-600 text-white" />
                  <span className="hidden xs:inline">{t('verified')}</span>
                </div>
              ) : currentUser.verificationStatus === 'pending' ? (
                <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200" title="Under Review">
                  <span className="hidden xs:inline">{t('pendingVerification')}</span>
                  <span className="xs:hidden">{t('pending')}</span>
                </div>
              ) : currentUser.role && currentUser.role !== 'admin' ? (
                <div className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded border border-red-100" title="Needs Aadhaar Upload">
                  <span className="hidden xs:inline">{t('unverified')}</span>
                </div>
              ) : null}

              {/* Admin Portal Shortcut (Strict check for admin role and identifier) */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2.5 py-1 transition-colors"
                >
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span>{t('adminPanel')}</span>
                </Link>
              )}

              {/* Welcome label */}
              <div className="hidden md:flex items-center gap-4 text-sm text-slate-600 mr-2">
                <span>{t('hello')}, <strong className="text-slate-800">{currentUser.name || 'User'}</strong></span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-2 rounded-lg border border-slate-200 transition-colors flex items-center justify-center touch-target"
                title={t('logout')}
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
