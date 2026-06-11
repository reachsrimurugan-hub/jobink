import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import TransitionLoader from './components/TransitionLoader';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TransitionLoader />
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
