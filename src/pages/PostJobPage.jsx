import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/db';
import { CITIES, LOCATIONS } from '../utils/locations';
import Navbar from '../components/Navbar';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDefaultCoordinates } from '../utils/geo';

const PostJobPage = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState('');
  const [paymentType, setPaymentType] = useState('per day');
  const [city, setCity] = useState(currentUser?.city || '');
  const [area, setArea] = useState(currentUser?.area || '');
  const [workingHours, setWorkingHours] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [isUrgentExplicit, setIsUrgentExplicit] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser.verified) {
      setError(t('verificationRequiredToPost'));
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError(t('pleaseFillTitleDesc'));
      return;
    }
    if (Number(payment) <= 0) {
      setError(t('paymentPositiveAmount'));
      return;
    }
    if (!city || !area) {
      setError(t('pleaseSelectCityArea'));
      return;
    }
    if (Number(workersNeeded) <= 0) {
      setError(t('atLeastOneWorker'));
      return;
    }

    try {
      setLoading(true);
      const coords = getDefaultCoordinates(city, area);
      const jobData = {
        employerId: currentUser.uid,
        employerName: currentUser.name,
        employerPhone: currentUser.phone,
        title,
        description,
        payment: Number(payment),
        paymentType,
        location: `${city}, ${area}`,
        city,
        area,
        workingHours,
        workersNeeded: Number(workersNeeded),
        startDate: startDate || '',
        isUrgentExplicit,
        latitude: coords.lat,
        longitude: coords.lng
      };

      await jobService.createJob(jobData);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(t('failedCreateJob'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar activeTab="jobs" />
      
      <main className="max-w-xl mx-auto px-4 py-8">
        {/* Back navigation */}
        <button 
          type="button" 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-6 touch-target"
        >
          <ArrowLeft size={16} />
          {t('backToDashboard')}
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 text-left">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="font-extrabold text-slate-800 text-lg">{t('postHelperRequirement')}</h2>
            <p className="text-slate-500 text-xs mt-1">{t('postJobSubtitle')}</p>
          </div>

          {!currentUser.verified && (
            <div className={`mb-5 p-4 rounded-xl border flex items-start gap-3 text-left shadow-sm ${
              currentUser.verificationStatus === 'pending'
                ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                : 'bg-red-50/70 border-red-200 text-red-800'
            }`}>
              <ShieldAlert className={currentUser.verificationStatus === 'pending' ? 'text-amber-600 shrink-0 mt-0.5' : 'text-red-600 shrink-0 mt-0.5'} size={18} />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  {currentUser.verificationStatus === 'pending' ? t('pendingVerification') : t('unverified')}
                </h4>
                <p className="text-xs mt-1 leading-normal font-medium text-slate-600">
                  {currentUser.verificationStatus === 'pending'
                    ? t('postJobLockedDesc')
                    : t('postJobLockedRejectedDesc')}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100 mb-5 flex items-start gap-1.5">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {t('jobTitleRequirement')}
              </label>
              <input
                id="jobTitle"
                type="text"
                placeholder={t('jobTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-850 touch-target"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="jobDesc" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {t('describeManualWork')}
              </label>
              <textarea
                id="jobDesc"
                rows={4}
                placeholder={t('describeWorkPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-medium text-slate-700"
                required
                disabled={loading}
              />
            </div>

            {/* Payment Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="payAmt" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('paymentInr')}
                </label>
                <input
                  id="payAmt"
                  type="number"
                  placeholder={t('payAmtPlaceholder')}
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-bold text-slate-800 touch-target"
                  required
                  min={1}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="payRate" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('paymentRate')}
                </label>
                <select
                  id="payRate"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-800 touch-target"
                  required
                  disabled={loading}
                >
                  <option value="per day">{t('perDay')}</option>
                  <option value="fixed">{t('fixedOneTime')}</option>
                </select>
              </div>
            </div>

            {/* Location (City & Area) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobCity" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('city')}
                </label>
                <select
                  id="jobCity"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setArea('');
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-855 touch-target"
                  required
                  disabled={loading}
                >
                  <option value="">{t('selectCity')}</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="jobArea" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('areaNeighborhood')}
                </label>
                <select
                  id="jobArea"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-855 touch-target"
                  required
                  disabled={loading || !city}
                >
                  <option value="">{t('selectArea')}</option>
                  {city && LOCATIONS[city]?.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date & Urgent Hiring Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Job Start Date & Time
                </label>
                <input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-800 touch-target"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center sm:pt-6 pt-2">
                <input
                  id="isUrgentExplicit"
                  type="checkbox"
                  checked={isUrgentExplicit}
                  onChange={(e) => setIsUrgentExplicit(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="isUrgentExplicit" className="ml-2 block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                  ⚡ Mark as Urgent Hiring
                </label>
              </div>
            </div>

            {/* Working Hours & Workers Needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobHours" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('workingHours')}
                </label>
                <input
                  id="jobHours"
                  type="text"
                  placeholder={t('workingHoursPlaceholder')}
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-800 touch-target"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="workersNeed" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  {t('workersNeeded')}
                </label>
                <input
                  id="workersNeed"
                  type="number"
                  placeholder={t('workersNeededPlaceholder')}
                  value={workersNeeded}
                  onChange={(e) => setWorkersNeeded(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-bold text-slate-800 touch-target"
                  required
                  min={1}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !currentUser.verified}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-all touch-target flex items-center justify-center mt-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-transparent"
            >
              {loading 
                ? t('creatingPost') 
                : !currentUser.verified 
                  ? t('verificationRequiredToPost') 
                  : t('postJobListing')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PostJobPage;
