import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

const TermsPage = () => {
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
            <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Terms & Conditions</h1>
          </div>

          {/* Terms content card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left text-[14px] text-slate-600 space-y-5 leading-relaxed">
            <div>
              <h2 className="font-bold text-slate-800 text-[18px] mb-2 uppercase tracking-wide">1. Introduction</h2>
              <p>
                By using the Jobink platform (WorkLink), you agree to these Terms & Conditions. This platform connects independent workers with household or business employers.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 text-[18px] mb-2 uppercase tracking-wide">2. Identity & Verification</h2>
              <p>
                Users must submit true and accurate details (Selfies, profile photos). Any misrepresentation will result in permanent account suspension and ban.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 text-[18px] mb-2 uppercase tracking-wide">3. Job Agreements</h2>
              <p>
                Employers are responsible for providing a safe environment, clear instructions, and timely payments. Workers are responsible for completing the task to the best of their abilities.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 text-[18px] mb-2 uppercase tracking-wide">4. Payment & Direct Transfer</h2>
              <p>
                Payments are transacted directly between the Employer and the Worker. Jobink is a facilitator and does not handle payments directly, escrow, or fee deductions.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 text-[18px] mb-2 uppercase tracking-wide">5. Safety & Behavior</h2>
              <p>
                Abusive language, fraud, non-payment, or safety violations will not be tolerated. Jobink reserves the right to terminate accounts that violate community rules.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsPage;
