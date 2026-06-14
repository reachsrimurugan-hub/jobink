import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  ShieldCheck, 
  MessageCircle, 
  Coins, 
  ArrowRight, 
  Phone, 
  UserCheck, 
  Truck, 
  Package, 
  Home, 
  Calendar, 
  Wrench, 
  Sparkles,
  CheckCircle,
  Star,
  Clock,
  Smartphone,
  User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  const categories = [
    { id: 'houseShifting', label: t('houseShifting') || 'House Shifting', icon: Home, color: 'text-indigo-600' },
    { id: 'packing', label: t('packing') || 'Packing', icon: Package, color: 'text-orange-500' },
    { id: 'cleaning', label: t('cleaning') || 'Cleaning', icon: Sparkles, color: 'text-emerald-500' },
    { id: 'delivery', label: t('delivery') || 'Delivery', icon: Truck, color: 'text-sky-500' },
    { id: 'eventSetup', label: t('eventSetup') || 'Event Setup', icon: Calendar, color: 'text-purple-500' },
    { id: 'helperJobs', label: t('helperJobs') || 'Helper Jobs', icon: Wrench, color: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans antialiased text-slate-800">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 py-3.5 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white">
              <Users size={16} />
            </div>
            <span className="font-extrabold text-xl text-[#2563EB] tracking-tight">
              Jobink
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-bold text-slate-700 hover:text-[#2563EB] transition-colors">
              {t('howItWorks') || 'How It Works'}
            </a>
            <a href="#segments" className="text-[13px] font-bold text-slate-700 hover:text-[#2563EB] transition-colors">
              {t('forEmployers') || 'For Employers'}
            </a>
            <a href="#segments" className="text-[13px] font-bold text-slate-700 hover:text-[#2563EB] transition-colors">
              {t('forWorkers') || 'For Workers'}
            </a>
            <a href="#trust" className="text-[13px] font-bold text-slate-700 hover:text-[#2563EB] transition-colors">
              {t('aboutUs') || 'About Us'}
            </a>
          </nav>

          <div className="flex items-center">
            {/* Language Selector */}
            <select
              value={i18n.language ? i18n.language.split('-')[0] : 'en'}
              onChange={handleLanguageChange}
              className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-2 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors mr-3"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>

            <button
              type="button"
              onClick={handleAction}
              className="text-[13px] font-bold text-[#2563EB] border border-[#2563EB] px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
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
              <p className="text-slate-505 text-sm sm:text-base max-w-md leading-relaxed font-normal text-slate-500">
                {t('connectDirectlyAadhaar') || 'Connect directly with Aadhaar-verified workers for delivery, packing, cleaning, event support, house shifting, and more.'}
              </p>
              
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleAction}
                  className="bg-[#2563EB] text-white font-bold py-3 px-8 rounded-lg text-sm flex items-center justify-center gap-2 w-fit"
                >
                  <span>{t('getStartedFreeArrow') || 'Get Started Free →'}</span>
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#2563EB] fill-[#2563EB]/10" />
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
                  src="/hero_illustration.webp" 
                  alt="Jobink Illustration" 
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
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Users size={20} />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#2563EB]">1000+</div>
                <div className="text-xs font-bold text-slate-800">{t('statWorkersVerified') || 'Workers Verified'}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{t('statWorkersVerifiedDesc') || 'Aadhaar verified & trusted'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-t md:border-t-0 md:border-x border-slate-100 md:px-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#2563EB]">500+</div>
                <div className="text-xs font-bold text-slate-800">{t('statLocalJobsPosted') || 'Local Jobs Posted'}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{t('statLocalJobsPostedDesc') || 'Every week by employers'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-t md:border-t-0 md:pl-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#2563EB]">24/7</div>
                <div className="text-xs font-bold text-slate-800">{t('statAvailableNearby') || 'Available Nearby'}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{t('statAvailableNearbyDesc') || 'Connect anytime, anywhere'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-white px-6">
          <div className="max-w-6xl mx-auto text-center flex flex-col gap-12">
            
            {/* Title with side lines */}
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-[1px] bg-slate-200"></div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {t('howItWorks') || 'How It Works'}
              </h2>
              <div className="w-12 h-[1px] bg-slate-200"></div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
              {/* Connecting Dashed Line for Desktop */}
              <div className="absolute top-[40%] left-[15%] right-[15%] h-[1px] border-t border-dashed border-[#2563EB]/30 hidden md:block z-0"></div>

              {/* Step 1 */}
              <div className="relative bg-white border border-slate-100 rounded-xl p-6 flex items-center gap-4 text-left shadow-sm z-10">
                <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">
                    {t('quickOtpVerify') || 'Quick OTP Verify'}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">
                    {t('step1OtpVerifyDescNew') || 'Log in securely using your mobile number and OTP.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative bg-white border border-slate-100 rounded-xl p-6 flex items-center gap-4 text-left shadow-sm z-10">
                <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">
                    {t('createProfileVerify') || 'Create Profile & Verify'}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">
                    {t('step2CreateProfileDescNew') || 'Select your role, upload Aadhaar for security badge, and list details.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative bg-white border border-slate-100 rounded-xl p-6 flex items-center gap-4 text-left shadow-sm z-10">
                <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">
                    {t('hireAndWork') || 'Hire & Work'}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">
                    {t('step3HireWorkDescNew') || 'Post jobs or apply to local jobs. Connect on WhatsApp instantly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Job Categories */}
        <section className="py-12 bg-white px-6">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-bold text-slate-900 text-center mb-8">
              {t('popularJobCategories') || 'Popular Job Categories'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={handleAction}
                    className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 bg-white shadow-sm cursor-pointer"
                  >
                    <IconComponent size={24} className={cat.color} />
                    <span className="font-bold text-xs text-slate-700">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* User Segments Section */}
        <section id="segments" className="py-16 bg-white px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Local Employers segment */}
            <div className="bg-[#F4F9FF] border border-blue-100/50 rounded-2xl p-8 flex flex-col sm:flex-row justify-between gap-6 shadow-sm">
              <div className="flex flex-col justify-between text-left gap-6 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Home size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{t('forLocalEmployers') || 'For Local Employers'}</h3>
                </div>
                
                <ul className="text-xs font-bold text-slate-700 flex flex-col gap-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#2563EB]" />
                    <span>{t('postJobs1Min') || 'Post Jobs in 1 Minute'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#2563EB]" />
                    <span>{t('verifiedWorkersOnly') || 'Verified Workers Only'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#2563EB]" />
                    <span>{t('whatsappContactInstantly') || 'WhatsApp Contact Instantly'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#2563EB]" />
                    <span>{t('workerRatingsReviews') || 'Worker Ratings & Reviews'}</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={handleAction}
                  className="bg-[#2563EB] text-white font-bold py-2.5 px-6 rounded-lg text-xs w-full sm:w-fit flex items-center justify-center gap-1.5"
                >
                  <span>{t('postAJobBtn') || 'Post a Job'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Phone Mockup HTML/CSS */}
              <div className="w-[170px] h-[300px] border-[5px] border-slate-800 rounded-3xl bg-white shadow-lg overflow-hidden shrink-0 mx-auto sm:mx-0 flex flex-col">
                {/* Phone Speaker & Camera Bar */}
                <div className="h-4 w-full bg-slate-800 flex justify-center items-center">
                  <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
                </div>
                {/* Mockup screen content */}
                <div className="flex-1 p-3 flex flex-col gap-3 text-left">
                  <span className="text-[10px] font-bold text-slate-900 border-b border-slate-100 pb-1 flex justify-between items-center">
                    <span>{t('employerMockupTitle') || 'Post a Job'}</span>
                    <span className="text-[8px] text-[#2563EB] bg-blue-50 px-1 rounded">V1.0</span>
                  </span>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-400">{t('employerMockupJobTitle') || 'Job Title'}</label>
                    <div className="h-6 border border-slate-100 rounded bg-slate-50 flex items-center px-1.5 text-[8px] text-slate-700 font-medium">{t('packing') || 'Packing Helper'}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-400">{t('employerMockupLocation') || 'Location'}</label>
                    <div className="h-6 border border-slate-100 rounded bg-slate-50 flex items-center px-1.5 text-[8px] text-slate-700 font-medium">{t('tNagarChennai') || 'T. Nagar, Chennai'}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-400">{t('employerMockupCategory') || 'Select Category'}</label>
                    <div className="h-6 border border-slate-100 rounded bg-slate-50 flex items-center px-1.5 text-[8px] text-slate-700 font-medium">{t('packing') || 'Packing'}</div>
                  </div>
                  <div className="h-7 bg-[#2563EB] text-white font-bold text-[9px] rounded flex items-center justify-center mt-auto cursor-pointer">
                    {t('employerMockupBtn') || 'Post Job'}
                  </div>
                </div>
              </div>
            </div>

            {/* Workers segment */}
            <div className="bg-[#F2FBF7] border border-emerald-100/50 rounded-2xl p-8 flex flex-col sm:flex-row justify-between gap-6 shadow-sm">
              <div className="flex flex-col justify-between text-left gap-6 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{t('forPartTimeWorkers') || 'For Part-Time Workers'}</h3>
                </div>
                
                <ul className="text-xs font-bold text-slate-700 flex flex-col gap-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#10B981]" />
                    <span>{t('findDailyJobsNearby') || 'Find Daily Jobs Nearby'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#10B981]" />
                    <span>{t('localOpportunitiesOnly') || 'Local Opportunities Only'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#10B981]" />
                    <span>{t('directUpiPayments') || 'Direct UPI Payments'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#10B981]" />
                    <span>{t('buildReputation') || 'Build Reputation & Get Jobs'}</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={handleAction}
                  className="bg-[#10B981] text-white font-bold py-2.5 px-6 rounded-lg text-xs w-full sm:w-fit flex items-center justify-center gap-1.5"
                >
                  <span>{t('findJobsBtn') || 'Find Jobs'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Phone Mockup HTML/CSS */}
              <div className="w-[170px] h-[300px] border-[5px] border-slate-800 rounded-3xl bg-white shadow-lg overflow-hidden shrink-0 mx-auto sm:mx-0 flex flex-col">
                {/* Phone Speaker & Camera Bar */}
                <div className="h-4 w-full bg-slate-800 flex justify-center items-center">
                  <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
                </div>
                {/* Mockup screen content */}
                <div className="flex-1 p-3 flex flex-col gap-2.5 text-left">
                  <span className="text-[10px] font-bold text-slate-900 border-b border-slate-100 pb-1 flex justify-between items-center">
                    <span>{t('workerMockupTitle') || 'Nearby Jobs'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </span>
                  
                  {/* Job List items */}
                  <div className="flex flex-col gap-2">
                    <div className="border border-slate-100 p-1.5 rounded bg-slate-50/50 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-800">
                        <span>{t('workerMockupDelivery') || 'Delivery Boy'}</span>
                        <span className="text-[#2563EB]">₹600 / {t('perDay')}</span>
                      </div>
                      <span className="text-[6px] text-slate-400 font-semibold">{t('tNagar1km')} {t('away')}</span>
                    </div>
                    
                    <div className="border border-slate-100 p-1.5 rounded bg-slate-50/50 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-800">
                        <span>{t('houseShifting') || 'House Shifting'}</span>
                        <span className="text-[#2563EB]">₹1200 / {t('perDay')}</span>
                      </div>
                      <span className="text-[6px] text-slate-400 font-semibold">{t('adyar3km')} {t('away')}</span>
                    </div>

                    <div className="border border-slate-100 p-1.5 rounded bg-slate-50/50 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-800">
                        <span>{t('workerMockupHelper') || 'Event Helper'}</span>
                        <span className="text-[#2563EB]">₹800 / {t('perDay')}</span>
                      </div>
                      <span className="text-[6px] text-slate-400 font-semibold">{t('mylapore2km')} {t('away')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Why Trust Section */}
        <section id="trust" className="py-16 bg-[#F4F9FF] border-t border-blue-50 px-6">
          <div className="max-w-6xl mx-auto text-center flex flex-col gap-10">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('whyTrustJobink') || 'Why Trust Jobink?'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              
              {/* Trust Badge 1 */}
              <div className="flex gap-3 bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{t('trustAadhaarTitle') || 'UPI Verified Users'}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">{t('trustAadhaarDesc') || 'Every user is verified for your safety.'}</p>
                </div>
              </div>

              {/* Trust Badge 2 */}
              <div className="flex gap-3 bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm">
                  ₹
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{t('trustNoMiddlemanTitle') || 'No Middleman Payments'}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">{t('trustNoMiddlemanDescNew') || 'Direct payments via UPI.'}</p>
                </div>
              </div>

              {/* Trust Badge 3 */}
              <div className="flex gap-3 bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{t('trustDirectTitle') || 'Direct Worker-Employer Contact'}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">{t('trustDirectDescNew') || 'Chat on WhatsApp Instantly.'}</p>
                </div>
              </div>

              {/* Trust Badge 4 */}
              <div className="flex gap-3 bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Star size={18} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{t('trustCommunityTitle') || 'Community Ratings'}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">{t('trustCommunityDescNew') || 'Ratings help build trust & reliability.'}</p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white">
              <Users size={12} />
            </div>
            <span className="font-bold text-md text-[#2563EB]">Jobink</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold text-slate-400">
            <button onClick={handleAction} className="hover:text-[#2563EB] transition-colors">{t('about') || 'About'}</button>
            <button onClick={handleAction} className="hover:text-[#2563EB] transition-colors">{t('privacyPolicy') || 'Privacy Policy'}</button>
            <button onClick={handleAction} className="hover:text-[#2563EB] transition-colors">{t('termsConditions') || 'Terms & Conditions'}</button>
            <button onClick={handleAction} className="hover:text-[#2563EB] transition-colors">{t('contact') || 'Contact'}</button>
          </div>
          
          <span className="text-[10px] text-slate-400 font-semibold">
            &copy; {new Date().getFullYear()} Jobink. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
