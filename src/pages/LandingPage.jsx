import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, 
  Users, 
  ShieldCheck, 
  MessageCircle, 
  Coins, 
  Clock
} from 'lucide-react';


const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleAction = () => {
    navigate('/login');
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };


  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans antialiased text-slate-800">

       {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 py-3.5 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-full bg-[#8f3bf6] flex items-center justify-center text-white">
              <Users size={16} />
            </div>
            <span className="font-extrabold text-xl text-[#8f3bf6] tracking-tight">
              Jobink
            </span>
          </div>
          

          <div className="flex items-center">
            {/* Language Selector */}
            <select
              value={i18n.language ? i18n.language.split('-')[0] : 'en'}
              onChange={handleLanguageChange}
              aria-label="Choose Language"
              className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-2 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors mr-3"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>

            <button
              type="button"
              onClick={handleAction}
              className="text-[13px] font-bold text-[#8f3bf6] border border-[#8f3bf6] px-6 py-2 rounded-lg hover:bg-rebeccapurple-50 transition-colors"
            >
              {t('login') || 'Login'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        
        {/* Hero Section */}
        <section className="bg-white py-16 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column */}
            <div className="flex flex-col gap-6 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-lg">
                {t('hireVerifiedLocalWorkers') || 'Hire Verified Local Workers in Minutes'}
              </h1>
              <p className="text-sm sm:text-base max-w-md leading-relaxed font-normal text-slate-600">
                {t('connectDirectlyAadhaar') || 'Connect directly with Aadhaar-verified workers for delivery, packing, cleaning, event support, house shifting, and more.'}
              </p>
              
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleAction}
                  className="bg-[#8f3bf6] text-white font-bold py-3 px-8 rounded-lg text-sm flex items-center justify-center gap-2 w-fit"
                >
                  <span>{t('getStartedFreeArrow') || 'Get Started Free →'}</span>
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#8f3bf6] fill-[#8f3bf6]/10" />
                  <span className="text-[11px] font-bold text-slate-600">{t('aadhaarVerifiedWorkersBadge') || 'Aadhaar Verified Workers'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-[#10B981] fill-[#10B981]/10" />
                  <span className="text-[11px] font-bold text-slate-600">{t('instantWhatsAppContactBadge') || 'Instant WhatsApp Contact'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-600">{t('directUpiPaymentsBadge') || 'Direct UPI Payments'}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="relative flex justify-center items-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                <img 
                  src="/icons/hero_illustartion.png" 
                  alt="Jobink Illustration" 
                  fetchPriority="high"
                  width="1024"
                  height="1024"
                  className="w-full h-auto rounded-3xl object-cover bg-white" 
                />
              </div>
            </div>


          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-8 border-y border-slate-100 bg-white px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 py-3">
              <div className="w-12 h-12 rounded-full bg-rebeccapurple-50 text-[#8f3bf6] flex items-center justify-center">
                <Users size={20} />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#8f3bf6]">1000+</div>
                <div className="text-xs font-bold text-slate-800">{t('statWorkersVerified') || 'Workers Verified'}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{t('statWorkersVerifiedDesc') || 'Aadhaar verified & trusted'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-t md:border-t-0 md:border-x border-slate-100 md:px-6">
              <div className="w-12 h-12 rounded-full bg-rebeccapurple-50 text-[#8f3bf6] flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#8f3bf6]">500+</div>
                <div className="text-xs font-bold text-slate-800">{t('statLocalJobsPosted') || 'Local Jobs Posted'}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{t('statLocalJobsPostedDesc') || 'Every week by employers'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-t md:border-t-0 md:pl-6">
              <div className="w-12 h-12 rounded-full bg-rebeccapurple-50 text-[#8f3bf6] flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#8f3bf6]">24/7</div>
                <div className="text-xs font-bold text-slate-800">{t('statAvailableNearby') || 'Available Nearby'}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{t('statAvailableNearbyDesc') || 'Connect anytime, anywhere'}</div>
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#8f3bf6] flex items-center justify-center text-white">
              <Users size={12} />
            </div>
            <span className="font-bold text-md text-[#8f3bf6]">Jobink</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold text-slate-600">
            <button onClick={handleAction} className="hover:text-[#8f3bf6] transition-colors">{t('about') || 'About'}</button>
            <button onClick={handleAction} className="hover:text-[#8f3bf6] transition-colors">{t('privacyPolicy') || 'Privacy Policy'}</button>
            <button onClick={handleAction} className="hover:text-[#8f3bf6] transition-colors">{t('termsConditions') || 'Terms & Conditions'}</button>
            <button onClick={handleAction} className="hover:text-[#8f3bf6] transition-colors">{t('contact') || 'Contact'}</button>
          </div>
          
          <span className="text-[10px] text-slate-600 font-semibold">
            &copy; {new Date().getFullYear()} Jobink. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
