import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ALL_SKILLS } from '../utils/locations';
import { ShieldCheck, UserCheck, Briefcase, Upload, Camera, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/db';
import { reverseGeocode } from '../services/geoapify';
import LocationAutocompleteModal from '../components/LocationAutocompleteModal';

// Client-side image compression helper using HTML5 Canvas
const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to webp format with 0.6 quality
      const compressedBase64 = canvas.toDataURL('image/webp', 0.6);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const RegisterPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const { t, i18n } = useTranslation();
  
  const [role, setRole] = useState('');
  const [name, setName] = useState(currentUser?.name || '');
  
  // Geolocation and Geoapify States
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [businessType, setBusinessType] = useState('Individual'); // For employers
  const [skills, setSkills] = useState([]); // For workers
  const availability = true; // For workers

  // Selfie and UPI Verification States
  const [upiId, setUpiId] = useState('');
  const [selfie, setSelfie] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profilePhotoUrl || '');
  const [onboardingPhone, setOnboardingPhone] = useState('');

  // Phone OTP verification states for Google-registered users
  const [phoneOtpRequested, setPhoneOtpRequested] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestDeviceLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support geolocation.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await reverseGeocode(latitude, longitude);
          if (result) {
            setLatitude(result.latitude);
            setLongitude(result.longitude);
            setFormattedAddress(result.formattedAddress);
            setLocality(result.locality);
            setCity(result.city);
            setDistrict(result.district);
            setState(result.state);
            setPostalCode(result.postalCode);
            setCountry(result.country);
            setLocationError('');
          } else {
            setLocationError('Failed to geocode your coordinates.');
          }
        } catch (err) {
          console.error(err);
          setLocationError('Failed to retrieve location details.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError('Location access is required to automatically detect your location.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (step === 2) {
      requestDeviceLocation();
    }
  }, [step]);

  const handleLocationSelect = (loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setFormattedAddress(loc.formattedAddress);
    setLocality(loc.locality);
    setCity(loc.city);
    setDistrict(loc.district);
    setState(loc.state);
    setPostalCode(loc.postalCode);
    setCountry(loc.country);
    setLocationError('');
  };

  // Handle phone verification Send OTP
  const handleSendPhoneOtp = async () => {
    setError('');
    const sanitized = onboardingPhone.replace(/[^0-9]/g, '');
    if (sanitized.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const formattedPhone = `+91${sanitized}`;
    try {
      setLoading(true);
      const result = await authService.signInWithPhone(formattedPhone, 'recaptcha-container');
      setConfirmationResult(result);
      setPhoneOtpRequested(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check your network and recaptcha.');
      setLoading(false);
    }
  };

  // Handle phone verification Confirm OTP
  const handleVerifyPhoneOtp = async () => {
    setError('');
    if (phoneOtpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    try {
      setLoading(true);
      await confirmationResult.confirm(phoneOtpCode);
      setPhoneVerified(true);
      setPhoneOtpRequested(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP code. Please check and try again.');
      setLoading(false);
    }
  };

  // Handle file base64 conversions
  const handleFileChange = (e, setFileState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSkillsToggle = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!currentUser?.phone) {
      if (onboardingPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!phoneVerified) {
        setError('Please verify your mobile number with OTP first.');
        return;
      }
    }
    if (!formattedAddress) {
      setError('Please select or enable a verified location.');
      return;
    }
    if (role === 'worker' && skills.length === 0) {
      setError('Please select at least one skill.');
      return;
    }

    setStep(3);
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError('');

    // UPI ID simple format check
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId.trim())) {
      setError('Please enter a valid UPI ID (e.g. username@bank).');
      return;
    }

    if (!selfie) {
      setError('Selfie photo is required for profile verification.');
      return;
    }

    try {
      setLoading(true);

      // Compress images on the client side
      const compressedSelfie = await compressImage(selfie, 800, 800);
      const compressedProfile = profilePhoto ? await compressImage(profilePhoto, 400, 400) : '';

      const profileData = {
        name,
        role,
        phone: currentUser.phone || `+91${onboardingPhone}`,
        location: formattedAddress || `${locality}, ${city}`,
        city: city || '',
        area: locality || city || '',
        latitude,
        longitude,
        formattedAddress,
        locality,
        district,
        state,
        postalCode,
        country,
        verificationStatus: 'pending', // Trust verification status is pending
        verified: false,
        phoneVerified: currentUser.phone ? true : phoneVerified,
        upiId: upiId.trim(),
        upiQrUrl: '',
        upiVerified: false,
        selfieUrl: compressedSelfie,
        selfieVerified: false,
        trustScore: 20, // Default trust score (20 for verified phone)
        completedJobs: 0,
        completedJobHistory: [],
        isFlagged: false,
        flagReason: '',
        averageRating: 0,
        totalReviews: 0,
        profilePhotoUrl: compressedProfile || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        language: i18n.language || 'en',
        createdAt: new Date().toISOString()
      };

      if (role === 'worker') {
        profileData.skills = skills;
        profileData.availability = availability;
      } else {
        profileData.businessType = businessType;
      }

      await updateProfile(profileData);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Onboarding failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 text-left">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="font-extrabold text-lg text-primary tracking-tight">{t('profileSetup')}</span>
            <p className="text-slate-500 text-xs mt-0.5">{t('profileSetupDesc')}</p>
          </div>
          <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
            {t('step')} {step} {t('of')} 3
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* STEP 1: Select Role */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              {t('whoAreYou')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('worker')}
                className="border-2 border-slate-200 hover:border-primary p-6 rounded-2xl flex flex-col items-center gap-3 text-center transition-all bg-white hover:bg-primary/5 active:scale-98 touch-target group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-885 text-sm">{t('iWantToWork')}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-normal">
                    {t('workerDesc')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('employer')}
                className="border-2 border-slate-200 hover:border-primary p-6 rounded-2xl flex flex-col items-center gap-3 text-center transition-all bg-white hover:bg-primary/5 active:scale-98 touch-target group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-885 text-sm">{t('iWantToHire')}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-normal">
                    {t('employerDesc')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Profile details */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              {t('enterDetails')} ({role === 'worker' ? t('iWantToWork') : t('iWantToHire')})
            </h3>

            {/* Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {t('fullNameAsAadhaar')}
              </label>
              <input
                id="fullName"
                type="text"
                placeholder={t('enterFullName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-800 touch-target"
                required
              />
            </div>

            {/* Mobile Number (if logged in via Google and phone is empty) */}
            {!currentUser?.phone && (
              <div className="flex flex-col gap-2">
                <label htmlFor="regPhone" className="block text-xs font-bold text-slate-700 mb-0.5 uppercase">
                  Mobile Number (for WhatsApp & Direct Contacts)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
                    <input
                      id="regPhone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={onboardingPhone}
                      onChange={(e) => setOnboardingPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-800 touch-target"
                      required
                      disabled={phoneVerified || phoneOtpRequested}
                    />
                  </div>
                  {!phoneVerified && !phoneOtpRequested && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-4 rounded-xl text-xs touch-target cursor-pointer"
                    >
                      Send OTP
                    </button>
                  )}
                  {phoneVerified && (
                    <span className="text-green-600 font-semibold text-xs flex items-center justify-center border border-green-200 bg-green-50 px-4 rounded-xl">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div id="recaptcha-container" className="my-1"></div>

                {phoneOtpRequested && (
                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <label htmlFor="regPhoneOtp" className="block text-[10px] font-bold text-slate-500 uppercase">
                      Enter 6-digit OTP
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="regPhoneOtp"
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="123456"
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:border-primary text-center tracking-widest text-sm font-bold text-slate-800"
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        className="bg-primary hover:bg-primary-dark text-white font-bold px-4 rounded-lg text-xs"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Employer Only: Business/Individual */}
            {role === 'employer' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('profileType')}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="businessType"
                      value="Individual"
                      checked={businessType === 'Individual'}
                      onChange={() => setBusinessType('Individual')}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    {t('individualHousehold')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="businessType"
                      value="Business"
                      checked={businessType === 'Business'}
                      onChange={() => setBusinessType('Business')}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    {t('shopSmallBusiness')}
                  </label>
                </div>
              </div>
            )}

            {/* Location Selection System (Automatic and Autocomplete fallback) */}
            <div className="flex flex-col gap-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                {t('location') || 'Location'}
              </label>

              {locationLoading && (
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center gap-3 animate-pulse">
                  <Loader2 className="text-primary animate-spin" size={24} />
                  <span className="text-xs font-semibold text-slate-500">Detecting your location...</span>
                </div>
              )}

              {!locationLoading && locationError && (
                <div className="border border-red-100 bg-red-50 rounded-xl p-5 flex flex-col gap-3.5 text-center">
                  <span className="text-xs font-semibold text-red-700">{locationError}</span>
                  <div className="flex gap-3 max-w-sm mx-auto w-full justify-center">
                    <button
                      type="button"
                      onClick={requestDeviceLocation}
                      className="bg-white border border-red-200 text-red-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:bg-red-100/50 transition-all cursor-pointer flex-1"
                    >
                      Enable Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:bg-red-700 transition-all cursor-pointer flex-1"
                    >
                      Choose Location
                    </button>
                  </div>
                </div>
              )}

              {!locationLoading && !locationError && formattedAddress && (
                <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col gap-3 shadow-sm border-l-4 border-l-emerald-500">
                  <div className="flex items-start gap-3 text-left">
                    <MapPin className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Current Location</span>
                      <strong className="text-xs font-bold text-slate-800 block mt-0.5 leading-snug">
                        {locality || city || 'Verified Area'}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5 leading-normal">
                        {formattedAddress}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle size={14} className="fill-emerald-500 text-white" /> Verified Location
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="text-xs font-bold text-primary hover:underline hover:text-primary-dark cursor-pointer transition-colors"
                    >
                      Change Location
                    </button>
                  </div>
                </div>
              )}

              {!locationLoading && !locationError && !formattedAddress && (
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center gap-4 text-center">
                  <span className="text-xs font-medium text-slate-500">We need your location to show jobs near you.</span>
                  <div className="flex gap-3 max-w-sm mx-auto w-full justify-center">
                    <button
                      type="button"
                      onClick={requestDeviceLocation}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer flex-1"
                    >
                      Enable Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:bg-slate-50 transition-all cursor-pointer flex-1"
                    >
                      Choose Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Worker Only: Skills Selection */}
            {role === 'worker' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('selectSkills')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200/80 p-3.5 rounded-xl bg-slate-50/50 no-scrollbar">
                  {ALL_SKILLS.map((skill) => {
                    const isChecked = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillsToggle(skill)}
                        className={`text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isChecked 
                            ? 'bg-primary/5 text-primary border-primary' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{skill}</span>
                        {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 font-bold py-3.5 rounded-xl text-xs text-slate-700 text-center transition-all touch-target cursor-pointer"
              >
                {t('back')}
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-all touch-target cursor-pointer"
              >
                Continue to Identity
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Identity & Trust Verification */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="flex flex-col gap-5">
            <div className="bg-amber-50 text-amber-800 text-xs border border-amber-100 p-4 rounded-xl flex items-start gap-2.5 leading-normal">
              <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                Please submit the details below to complete your trust verification. These details are used to verify your profile and protect the marketplace.
              </div>
            </div>

            {/* Selfie Verification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Selfie Verification
              </label>
              <p className="text-slate-500 text-[11px] mb-2 leading-relaxed">
                Take a clear selfie of your face. Ensure your face is clearly visible without sunglasses or hats.
              </p>
              <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                {selfie ? (
                  <div className="text-center w-full relative">
                    <img src={selfie} alt="Selfie preview" className="w-20 h-20 rounded-full object-cover mx-auto border border-slate-200 mb-2 shadow-sm" />
                    <span className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1">
                      <ShieldCheck size={14} /> Selfie Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelfie('')}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Remove & Retake
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col sm:flex-row gap-3">
                    {/* Option 1: Take Selfie directly */}
                    <label className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-center transition-all hover:border-primary">
                      <Camera size={20} className="text-primary" />
                      <span className="text-xs font-bold text-slate-700">Take Selfie</span>
                      <span className="text-[10px] text-slate-400">Uses front camera directly</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileChange(e, setSelfie)}
                        className="hidden"
                        required={!selfie}
                        disabled={loading}
                      />
                    </label>
                    {/* Option 2: Upload from Local Files */}
                    <label className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-center transition-all hover:border-primary">
                      <Upload size={20} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-700">Upload Photo</span>
                      <span className="text-[10px] text-slate-400">Choose from gallery/files</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setSelfie)}
                        className="hidden"
                        required={!selfie}
                        disabled={loading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* UPI ID */}
            <div>
              <label htmlFor="upiIdInput" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                UPI ID (For Direct Payments)
              </label>
              <input
                id="upiIdInput"
                type="text"
                placeholder="username@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-800 touch-target"
                required
                disabled={loading}
              />
              <p className="text-slate-400 text-[10px] mt-1">
                E.g. user@okaxis, 9876543210@paytm. Verified helpers receive payments direct to this ID.
              </p>
            </div>

            {/* Profile Photo File */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Public Profile Photo
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-white transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setProfilePhoto)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={loading}
                />
                {profilePhoto ? (
                  <div className="text-center w-full">
                    <img src={profilePhoto} alt="Profile preview" className="w-16 h-16 rounded-full object-cover mx-auto border border-slate-200 mb-1" />
                    <span className="text-[10px] text-green-600 font-semibold block">✓ Profile Photo Selected</span>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Select public photo (Optional)</span>
                    <span className="text-[10px] text-slate-400">A friendly photo for your profile card</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 border border-slate-200 hover:bg-slate-50 font-bold py-3.5 rounded-xl text-xs text-slate-700 text-center transition-all touch-target cursor-pointer"
              >
                {t('back')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-all touch-target flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit Profile Verification'}
              </button>
            </div>
          </form>
        )}
        {isLocationModalOpen && (
          <LocationAutocompleteModal
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            onSelect={handleLocationSelect}
          />
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
