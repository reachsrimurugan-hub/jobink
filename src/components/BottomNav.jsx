import React from 'react';
import { Home, Briefcase, Bell, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const BottomNav = ({ role, activeTab, setActiveTab, unreadCount = 0 }) => {
  const { t } = useTranslation();
  const { startTransition, endTransition } = useAuth();
  
  const tabs = role === 'worker' ? [
    { id: 'home', label: t('feed'), icon: Home },
    { id: 'applications', label: t('applied'), icon: Briefcase },
    { id: 'notifications', label: t('alerts'), icon: Bell, badge: unreadCount },
    { id: 'profile', label: t('profile'), icon: User }
  ] : [
    { id: 'home', label: t('overview'), icon: Home },
    { id: 'jobs', label: t('myPosts'), icon: Briefcase },
    { id: 'notifications', label: t('alerts'), icon: Bell, badge: unreadCount },
    { id: 'profile', label: t('profile'), icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around pb-safe pt-2 md:hidden">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (activeTab === tab.id) return;
              startTransition();
              setActiveTab(tab.id);
              setTimeout(() => {
                endTransition();
              }, 450);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 relative transition-colors"
            aria-label={tab.label}
          >
            <div className="relative flex items-center justify-center text-slate-400">
              <IconComponent 
                size={22} 
                className={`${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'} transition-colors duration-150`}
              />
              {tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white font-bold text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border border-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary font-semibold' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
