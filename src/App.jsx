import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import TransitionLoader from './components/TransitionLoader';
import InstallBanner from './components/InstallBanner';
import UpdatePrompt from './components/UpdatePrompt';

function App() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      window.deferredPrompt = e;
      // Dispatch custom event to notify InstallBanner
      window.dispatchEvent(new CustomEvent('pwa-install-prompt-available'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <TransitionLoader />
        <UpdatePrompt />
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
          <AppRoutes />
        </div>
        <InstallBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

