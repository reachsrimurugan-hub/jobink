import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-12">
      <div>
        <Navbar activeTab="" />

        <main className="max-w-xl mx-auto px-4 py-8">
          {/* Header Row */}
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#6D28D9] hover:border-[#6D28D9]/30 transition-all cursor-pointer shadow-sm"
              aria-label="Go Back"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Help & Support</h1>
          </div>

          <div className="space-y-6">
            {/* Intro text */}
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Welcome to Jobink Help & Support. If you need any assistance regarding jobs, profile validation, or payments, feel free to contact us.
            </p>

            {/* Support Actions Card */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between min-h-[56px]">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">WhatsApp Support</span>
                    <strong className="text-[17px] text-slate-700 font-mono">+91 99999 99999</strong>
                  </div>
                </div>
                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Chat Now
                </a>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between min-h-[56px]">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#6D28D9]/10 text-[#6D28D9] flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Email Support</span>
                    <strong className="text-[17px] text-slate-700 font-mono">support@jobink.in</strong>
                  </div>
                </div>
                <a
                  href="mailto:support@jobink.in"
                  className="bg-[#6D28D9] hover:bg-[#6D28D9]/90 text-white text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Email Us
                </a>
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
              <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4 divide-y divide-slate-100 text-[14px]">
                <div className="pt-0">
                  <strong className="text-slate-700 block mb-1">How long does Trust Verification take?</strong>
                  <p className="text-slate-500 leading-relaxed">Identity verification by our admin team usually takes 2-4 business hours.</p>
                </div>
                
                <div className="pt-4">
                  <strong className="text-slate-700 block mb-1">How are payments processed?</strong>
                  <p className="text-slate-500 leading-relaxed">Payments are made directly from employers to workers via UPI once the job is marked as completed.</p>
                </div>
                
                <div className="pt-4">
                  <strong className="text-slate-700 block mb-1">What happens if a dispute occurs?</strong>
                  <p className="text-slate-500 leading-relaxed">If there is an issue with payment or completion, you can raise a dispute directly from your dashboard to invoke admin review.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HelpPage;
