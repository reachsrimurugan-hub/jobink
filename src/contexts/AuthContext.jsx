import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/db';
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
    // Listen for authentication changes (both Firebase & Mock)
    const unsubscribe = authService.onAuthChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
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
      const result = await authService.signInWithGoogle();
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setConfirmationResult(null);
      setPhoneNumberAttempt('');
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) throw new Error("No active user session.");
    try {
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
      const freshUser = await authService.getCurrentUser(currentUser.uid);
      if (freshUser) {
        setCurrentUser(freshUser);
      }
    } catch (error) {
      console.error("Failed to reload user profile:", error);
    }
  };

  const value = {
    currentUser,
    loading,
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
      {!loading ? children : (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
          <div className="spinner mb-4"></div>
          <p className="text-slate-500 font-medium text-sm">Loading WorkLink...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};
