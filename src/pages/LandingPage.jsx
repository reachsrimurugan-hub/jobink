import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ShieldCheck, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMetadata } from '../hooks/useMetadata';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useMetadata(
    "JobLink - Hyperlocal Part-Time Jobs & Helpers Marketplace",
    "JobLink connects shop owners, local employers, and households with verified part-time helpers in their neighborhood instantly. Easy UPI payments and Aadhaar verified badges."
  );

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-100 py-4 px-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="font-bold text-xl text-primary tracking-tight">Jobink</span>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-primary border border-primary/20 hover:border-primary px-4 py-2 rounded-lg transition-colors touch-target flex items-center justify-center"
          >
            {t('login')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Hero Section */}
        <div className="text-center py-6 flex flex-col items-center gap-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight sm:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="text-slate-600 text-sm max-w-md leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-sm transition-all touch-target"
            >
              {t('getStartedFree')}
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* How it Works */}
        <section className="text-left flex flex-col gap-5">
          <h2 className="text-xl font-bold text-slate-800 border-l-4 border-primary pl-2.5">
            {t('howWorks') || t('howItWorks')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <span className="font-extrabold text-primary text-xl">1</span>
              <h3 className="font-bold text-slate-800 text-sm mt-2">{t('quickOtpVerify')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('quickOtpVerifyDesc')}
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <span className="font-extrabold text-primary text-xl">2</span>
              <h3 className="font-bold text-slate-800 text-sm mt-2">{t('createProfileVerify')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('createProfileVerifyDesc')}
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <span className="font-extrabold text-primary text-xl">3</span>
              <h3 className="font-bold text-slate-800 text-sm mt-2">{t('hireAndWork')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('hireAndWorkDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
          <div className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Users className="text-primary shrink-0" size={18} />
              {t('forLocalEmployers')}
            </h3>
            <ul className="text-xs text-slate-600 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
              <li>{t('employerBenefit1')}</li>
              <li>{t('employerBenefit2')}</li>
              <li>{t('employerBenefit3')}</li>
              <li>{t('employerBenefit4')}</li>
              <li>{t('employerBenefit5')}</li>
            </ul>
          </div>

          <div className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Briefcase className="text-primary shrink-0" size={18} />
              {t('forPartTimeWorkers')}
            </h3>
            <ul className="text-xs text-slate-600 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
              <li>{t('workerBenefit1')}</li>
              <li>{t('workerBenefit2')}</li>
              <li>{t('workerBenefit3')}</li>
              <li>{t('workerBenefit4')}</li>
              <li>{t('workerBenefit5')}</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 px-4 text-center mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Jobink Marketplace. All rights reserved.</span>
          <div className="flex gap-4">
            <span>Direct UPI Payments</span>
            <span>•</span>
            <span>Aadhaar Audited</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
