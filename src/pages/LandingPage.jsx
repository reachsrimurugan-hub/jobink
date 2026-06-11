import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ShieldCheck, MapPin, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-100 py-4 px-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="font-bold text-xl text-primary tracking-tight">WorkLink</span>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-primary border border-primary/20 hover:border-primary px-4 py-2 rounded-lg transition-colors touch-target flex items-center justify-center"
          >
            Log In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Hero Section */}
        <div className="text-center py-6 flex flex-col items-center gap-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight sm:text-4xl">
            Find Local Part-Time <br />
            <span className="text-primary">Workers & Jobs Nearby</span>
          </h1>
          <p className="text-slate-600 text-sm max-w-md leading-relaxed">
            The simplest way for shop owners, event organizers, and households to hire verified part-time helpers in their own locality.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-sm transition-all touch-target"
            >
              Get Started (Free)
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* How it Works */}
        <section className="text-left flex flex-col gap-5">
          <h2 className="text-xl font-bold text-slate-800 border-l-4 border-primary pl-2.5">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <span className="font-extrabold text-primary text-xl">1</span>
              <h3 className="font-bold text-slate-800 text-sm mt-2">Quick OTP Verify</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Log in securely using your mobile number and simple OTP.
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <span className="font-extrabold text-primary text-xl">2</span>
              <h3 className="font-bold text-slate-800 text-sm mt-2">Create Profile & Verify</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Select your role, upload Aadhaar for security badge, and list details.
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <span className="font-extrabold text-primary text-xl">3</span>
              <h3 className="font-bold text-slate-800 text-sm mt-2">Hire & Work</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Post helper needs or apply to local jobs. Connect on WhatsApp instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
          <div className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Users className="text-primary shrink-0" size={18} />
              For Local Employers
            </h3>
            <ul className="text-xs text-slate-600 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
              <li>Post helper requirements in 1 minute.</li>
              <li>Filter candidates by neighborhood/area.</li>
              <li>Access only verified workers (Aadhaar audited).</li>
              <li>Contact selected helpers directly via WhatsApp/Call.</li>
              <li>Rate helpers to keep the community reliable.</li>
            </ul>
          </div>

          <div className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Briefcase className="text-primary shrink-0" size={18} />
              For Part-Time Workers
            </h3>
            <ul className="text-xs text-slate-600 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
              <li>Find daily/fixed packing, delivery, support jobs near you.</li>
              <li>Toggle availability to get noticed.</li>
              <li>Earn direct UPI payments from trusted local businesses.</li>
              <li>Build reviews score to get hired faster.</li>
              <li>Completely free: zero broker cuts.</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 px-4 text-center mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} WorkLink Marketplace. All rights reserved.</span>
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
