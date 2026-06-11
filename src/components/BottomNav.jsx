import React from 'react';
import { Home, Briefcase, Bell, User, PlusCircle } from 'lucide-react';

const BottomNav = ({ role, activeTab, setActiveTab, unreadCount = 0 }) => {
  const tabs = role === 'worker' ? [
    { id: 'home', label: 'Feed', icon: Home },
    { id: 'applications', label: 'Applied', icon: Briefcase },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
  ] : [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'jobs', label: 'My Posts', icon: Briefcase },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
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
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 relative transition-colors"
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
