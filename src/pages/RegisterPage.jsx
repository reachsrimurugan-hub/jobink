import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CITIES, LOCATIONS, ALL_SKILLS } from '../utils/locations';
import { ShieldCheck, UserCheck, Briefcase, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const { t, i18n } = useTranslation();
  
  // Registration States
  const [role, setRole] = useState('');
  const [name, setName] = useState(currentUser?.name || '');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [businessType, setBusinessType] = useState('Individual'); // For employers
  const [skills, setSkills] = useState([]); // For workers
  const [availability, setAvailability] = useState(true); // For workers
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profilePhotoUrl || '');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (!city || !area) {
      setError('Please select both city and area.');
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

    if (aadhaarNumber.length !== 12 || !/^[0-9]+$/.test(aadhaarNumber)) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    try {
      setLoading(true);
      const profileData = {
        name,
        role,
        phone: currentUser.phone || '',
        location: `${city}, ${area}`,
        city,
        area,
        verificationStatus: 'pending', // Set to pending for admin verification
        verified: false,
        aadhaarNumber,
        aadhaarPhotoUrl: aadhaarPhoto || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500', // Default placeholder
        profilePhotoUrl: profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Default placeholder
        language: i18n.language || 'en', // Save current language choice to profile
        createdAt: new Date().toISOString()
      };

      if (role === 'worker') {
        profileData.skills = skills;
        profileData.availability = availability;
        profileData.rating = 0;
        profileData.ratingCount = 0;
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

            {/* Location (City & Area) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="citySelect" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('city')}
                </label>
                <select
                  id="citySelect"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setArea(''); // reset area
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-800 touch-target cursor-pointer"
                  required
                >
                  <option value="">{t('selectCity')}</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="areaSelect" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('areaNeighborhood')}
                </label>
                <select
                  id="areaSelect"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-800 touch-target cursor-pointer"
                  required
                  disabled={!city}
                >
                  <option value="">{t('selectArea')}</option>
                  {city && LOCATIONS[city]?.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
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
                {t('continueToIdentity')}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Identity upload (Aadhaar & Photo) */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="flex flex-col gap-5">
            <div className="bg-amber-50 text-amber-800 text-xs border border-amber-100 p-4 rounded-xl flex items-start gap-2.5 leading-normal">
              <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                {t('aadhaarVerifyRequired')}
              </div>
            </div>

            {/* Aadhaar Number */}
            <div>
              <label htmlFor="aadhaar" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {t('aadhaarNumberLabel')}
              </label>
              <input
                id="aadhaar"
                type="text"
                placeholder="1234 5678 9012"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold tracking-wider text-slate-800 touch-target"
                maxLength={12}
                required
                disabled={loading}
              />
            </div>

            {/* Aadhaar Photo File */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {t('uploadAadhaarPhoto')}
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-white transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setAadhaarPhoto)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required={!aadhaarPhoto}
                />
                {aadhaarPhoto ? (
                  <div className="text-center w-full">
                    <img src={aadhaarPhoto} alt="Aadhaar preview" className="max-h-24 mx-auto rounded border border-slate-200 mb-1" />
                    <span className="text-[10px] text-green-600 font-semibold block">✓ Aadhaar Selected</span>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">{t('selectImageFile')}</span>
                    <span className="text-[10px] text-slate-400">{t('pngJpgFormats')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Profile Photo File */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {t('uploadProfilePhoto')}
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-white transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setProfilePhoto)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required={!profilePhoto}
                />
                {profilePhoto ? (
                  <div className="text-center w-full">
                    <img src={profilePhoto} alt="Profile preview" className="w-16 h-16 rounded-full object-cover mx-auto border border-slate-200 mb-1" />
                    <span className="text-[10px] text-green-600 font-semibold block">✓ Profile Photo Selected</span>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">{t('selectImageFile')}</span>
                    <span className="text-[10px] text-slate-400">{t('faceClearlyVisible')}</span>
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
                {loading ? t('sending') : t('submitProfileForApproval')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
