import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TransitionLoader = () => {
  const { isTransitioning } = useAuth();

  if (!isTransitioning) return null;

  return (
    <>
      {/* Sleek Top Progress Bar */}
      <div className="top-loader-bar" />
      {/* Subtle overlay to prevent double inputs and block click actions during active transition */}
      <div className="fixed inset-0 z-50 bg-white/5 backdrop-blur-[0.5px] cursor-wait pointer-events-auto" />
    </>
  );
};

export default TransitionLoader;
