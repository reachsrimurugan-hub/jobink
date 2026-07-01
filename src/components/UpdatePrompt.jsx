import React, { useState, useEffect } from'react';
import { X, RefreshCw } from'lucide-react';

const UpdatePrompt = () => {
 const [showPrompt, setShowPrompt] = useState(false);
 const [swRegistration, setSwRegistration] = useState(null);

 useEffect(() => {
 const handleUpdateAvailable = (event) => {
 console.log('[PWA] Service worker update detected');
 setSwRegistration(event.detail);
 setShowPrompt(true);
 };

 window.addEventListener('sw-update-available', handleUpdateAvailable);

 return () => {
 window.removeEventListener('sw-update-available', handleUpdateAvailable);
 };
 }, []);

 const handleUpdateClick = () => {
 if (swRegistration && swRegistration.waiting) {
 console.log('[PWA] Sending skip waiting message to waiting service worker');
 swRegistration.waiting.postMessage({ type:'SKIP_WAITING' });
 setShowPrompt(false);
 }
 };

 const handleDismiss = () => {
 setShowPrompt(false);
 };

 if (!showPrompt) return null;

 return (
 <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96 animate-slide-down">
 <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 relative">
 {/* Info */}
 <div className="flex items-center gap-3 text-white">
 <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
 <RefreshCw size={20} className="animate-spin" style={{ animationDuration:'3s' }} />
 </div>
 <div>
 <h3 className="text-sm font-bold leading-tight">App Update Available</h3>
 <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Get the latest features and fixes.</p>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleUpdateClick}
 className="bg-primary text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm cursor-pointer touch-target"
 >
 Update
 </button>
 
 <button
 type="button"
 onClick={handleDismiss}
 className="text-slate-400 p-1.5 rounded-lg"
 aria-label="Dismiss update"
 >
 <X size={16} />
 </button>
 </div>
 </div>
 </div>
 );
};

export default UpdatePrompt;
