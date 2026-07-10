import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/i18n';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneNumberAttempt, setPhoneNumberAttempt] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = () => setIsTransitioning(true);
  const endTransition = () => setIsTransitioning(false);

  useEffect(() => {
    let active = true;
    let unsubscribe;

    import('../services/db').then(({ authService }) => {
      if (!active) return;
      unsubscribe = authService.onAuthChanged((user) => {
        if (!active) return;
        setCurrentUser(user);
        setLoading(false);
        if (user) {
          localStorage.setItem('jobink_loggedIn', 'true');
        } else {
          localStorage.setItem('jobink_loggedIn', 'false');
        }
      });
    }).catch(err => {
      console.error("Failed to load auth service:", err);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Sync language with currentUser on load
  useEffect(() => {
    if (currentUser && currentUser.language && currentUser.language !== i18n.language) {
      i18n.changeLanguage(currentUser.language);
    }
  }, [currentUser]);

  const loginWithPhone = async (phoneNumber, elementId) => {
    try {
      const { authService } = await import('../services/db');
      const result = await authService.signInWithPhone(phoneNumber, elementId);
      setConfirmationResult(result);
      setPhoneNumberAttempt(phoneNumber);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const confirmOTP = async (otpCode) => {
    try {
      if (!confirmationResult) {
        throw new Error("No login attempt in progress. Please request OTP first.");
      }
      const result = await confirmationResult.confirm(otpCode);
      // Clean up verification state
      setConfirmationResult(null);
      setPhoneNumberAttempt('');
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { authService } = await import('../services/db');
      const result = await authService.signInWithGoogle();
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Synchronously clear local user states so redirection happens instantly
      setCurrentUser(null);
      setConfirmationResult(null);
      setPhoneNumberAttempt('');
      localStorage.setItem('jobink_loggedIn', 'false');
      sessionStorage.clear();

      // Perform Firebase auth signout in the background
      const { authService } = await import('../services/db');
      await authService.logout();
    } catch (error) {
      console.error("Firebase logout error:", error);
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) throw new Error("No active user session.");
    try {
      const { authService } = await import('../services/db');
      const updatedUser = await authService.saveUserProfile(currentUser.uid, profileData);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const reloadProfile = async () => {
    if (!currentUser) return;
    try {
      const { authService } = await import('../services/db');
      const freshUser = await authService.getCurrentUser(currentUser.uid);
      if (freshUser) {
        setCurrentUser(freshUser);
      }
    } catch (error) {
      console.error("Failed to reload user profile:", error);
    }
  };

  const adminIdentifier = import.meta.env.VITE_ADMIN_IDENTIFIER;
  const isAdmin = currentUser?.role === 'admin' && (
    currentUser.uid === adminIdentifier ||
    currentUser.phone === adminIdentifier ||
    (currentUser.email && currentUser.email === adminIdentifier)
  );

  const value = {
    currentUser,
    loading,
    isAdmin,
    phoneNumberAttempt,
    isTransitioning,
    startTransition,
    endTransition,
    loginWithPhone,
    confirmOTP,
    loginWithGoogle,
    logout,
    updateProfile,
    reloadProfile,
    otpRequested: !!confirmationResult
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
