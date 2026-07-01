import React, { useState, useEffect } from'react';
import { X, Download } from'lucide-react';

const InstallBanner = () => {
 const [showBanner, setShowBanner] = useState(false);

 useEffect(() => {
 const checkInstallability = () => {
 // 1. Check if already in standalone mode (already installed)
 const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
 if (isStandalone) {
 return;
 }

 // 2. Check if dismissed recently
 const dismissedUntil = localStorage.getItem('jobink_install_dismissed_until');
 if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
 return;
 }

 // 3. Check if deferredPrompt is available
 if (window.deferredPrompt) {
 setShowBanner(true);
 }
 };

 // Initial check
 checkInstallability();

 // Event listener for custom trigger
 const onPromptAvailable = () => {
 checkInstallability();
 };

 window.addEventListener('pwa-install-prompt-available', onPromptAvailable);
 window.addEventListener('appinstalled', () => {
 setShowBanner(false);
 window.deferredPrompt = null;
 });

 return () => {
 window.removeEventListener('pwa-install-prompt-available', onPromptAvailable);
 };
 }, []);

 const handleInstallClick = async () => {
 const promptEvent = window.deferredPrompt;
 if (!promptEvent) return;

 // Show the browser install prompt
 promptEvent.prompt();

 // Wait for the user to respond to the prompt
 const { outcome } = await promptEvent.userChoice;
 console.log(`[PWA] User choice outcome: ${outcome}`);

 if (outcome ==='accepted') {
 console.log('[PWA] User accepted the install prompt');
 setShowBanner(false);
 window.deferredPrompt = null;
 } else {
 console.log('[PWA] User dismissed the install prompt');
 // Set a 24 hour cooldown
 const cooldown = Date.now() + 24 * 60 * 60 * 1000;
 localStorage.setItem('jobink_install_dismissed_until', cooldown.toString());
 setShowBanner(false);
 }
 };

 const handleDismiss = () => {
 // Set a 24 hour cooldown when dismissed manually
 const cooldown = Date.now() + 24 * 60 * 60 * 1000;
 localStorage.setItem('jobink_install_dismissed_until', cooldown.toString());
 setShowBanner(false);
 };

 if (!showBanner) return null;

 return (
 <div className="fixed bottom-[76px] left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-96 animate-slide-up">
 <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 relative">
 {/* App Icon */}
 <div className="flex items-center gap-3">
 <img 
 src="/favicon.png" 
 alt="JobInk Logo" 
 className="w-12 h-12 rounded-xl object-contain shadow-sm bg-slate-50 border border-slate-100"
 />
 <div>
 <h3 className="text-sm font-bold text-slate-800 leading-tight">Install JobInk</h3>
 <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Hyperlocal Jobs Platform</p>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleInstallClick}
 className="bg-primary text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm shadow-primary/20 touch-target cursor-pointer"
 >
 <Download size={14} />
 Install
 </button>
 
 <button
 type="button"
 onClick={handleDismiss}
 className="text-slate-400 p-1.5 rounded-lg"
 aria-label="Dismiss banner"
 >
 <X size={16} />
 </button>
 </div>
 </div>
 </div>
 );
};

export default InstallBanner;
