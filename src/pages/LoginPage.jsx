import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Phone, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { loginWithPhone, confirmOTP, loginWithGoogle, otpRequested, phoneNumberAttempt } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Quick regex validation
    const sanitized = phoneNumber.replace(/[^0-9]/g, '');
    if (sanitized.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const formattedPhone = `+91${sanitized.slice(-10)}`;

    try {
      setLoadingLocal(true);
      await loginWithPhone(formattedPhone, 'recaptcha-container');
      setSuccess(`${t('otpSentTo')} ${formattedPhone}`);
      setLoadingLocal(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setLoadingLocal(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setLoadingLocal(true);
      const user = await confirmOTP(otpCode);
      setLoadingLocal(false);
      
      // Redirect based on whether profile role is set
      if (user && user.role) {
        navigate('/dashboard');
      } else {
        navigate('/register');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP code. Please check and try again.');
      setLoadingLocal(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      setLoadingLocal(true);
      const user = await loginWithGoogle();
      setLoadingLocal(false);
      
      if (user && user.role) {
        navigate('/dashboard');
      } else {
        navigate('/register');
      }
    } catch (err) {
      console.error(err);
      setError('Google login failed.');
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Back button */}
      <button 
        type="button" 
        onClick={() => navigate('/')} 
        className="absolute top-4 left-4 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm touch-target cursor-pointer"
      >
        <ArrowLeft size={14} />
        {t('back')}
      </button>

      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 text-center">
        {/* Brand Header */}
        <div>
          <span className="font-extrabold text-2xl text-primary tracking-tight">WorkLink</span>
          <p className="text-slate-500 text-xs mt-1.5">{t('appTagline')}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100 text-left flex items-start gap-1.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-xs font-semibold p-3 rounded-lg border border-green-100 text-left flex items-start gap-1.5">
            <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Inputs */}
        {!otpRequested ? (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                {t('mobilePhoneNumber')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder={t('enter10Digit')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold text-slate-800 touch-target"
                  maxLength={10}
                  required
                  disabled={loadingLocal}
                />
              </div>
            </div>

            {/* Google Recaptcha Verifier Target */}
            <div id="recaptcha-container"></div>

            <button
              type="submit"
              disabled={loadingLocal}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-all touch-target flex items-center justify-center cursor-pointer"
            >
              {loadingLocal ? t('sending') : t('requestOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4 text-left">
            <div className="text-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-600 mb-1">
              {t('otpSentTo')} <strong>{phoneNumberAttempt}</strong>
            </div>

            <div>
              <label htmlFor="otp" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                {t('sixDigitOtp')}
              </label>
              <input
                id="otp"
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder={t('enterOtpCode')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-center tracking-widest text-lg font-bold text-slate-800 touch-target"
                maxLength={6}
                required
                disabled={loadingLocal}
              />
            </div>

            <button
              type="submit"
              disabled={loadingLocal}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-all touch-target flex items-center justify-center cursor-pointer"
            >
              {loadingLocal ? t('verifying') : t('verifyOtpLogin')}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 my-1">
          <hr className="w-1/3 border-slate-200" />
          <span>{t('or')}</span>
          <hr className="w-1/3 border-slate-200" />
        </div>

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loadingLocal}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all touch-target flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t('continueWithGoogle')}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
