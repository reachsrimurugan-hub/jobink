import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, jobService, applicationService, notificationService, reviewService, queryService } from '../services/db';
import { CITIES, LOCATIONS } from '../utils/locations';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import JobCard from '../components/JobCard';
import NotificationCard from '../components/NotificationCard';
import RatingStars from '../components/RatingStars';
import ProfileViewModal from '../components/ProfileViewModal';
import Modal from '../components/Modal';
import { MapPin, Briefcase, Bell, User, Clock, Star, Edit3, ShieldAlert, MessageSquare, Search, Filter, SlidersHorizontal, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WorkerDashboard = () => {
  const { currentUser, updateProfile, reloadProfile } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'home');
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Profile Viewer State
  const [selectedEmployerId, setSelectedEmployerId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [canReviewEmployer, setCanReviewEmployer] = useState(false);

  const handleViewEmployerProfile = (employerId) => {
    setSelectedEmployerId(employerId);
    const workedWithEmployer = myApplications.some(
      app => app.employerId === employerId && app.status === 'selected' && app.jobStatus === 'completed'
    );
    setCanReviewEmployer(workedWithEmployer);
    setIsProfileModalOpen(true);
  };
  
  // Filtering States (Default to worker's registered location)
  const [filterCity, setFilterCity] = useState(currentUser?.city || '');
  const [filterArea, setFilterArea] = useState(currentUser?.area || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Applications Filtering States
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [showAppFilters, setShowAppFilters] = useState(false);
  
  // Availability toggle loading helper
  const [availLoading, setAvailLoading] = useState(false);

  // Profile edit states
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Dispute Modal States
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeJobId, setDisputeJobId] = useState('');
  const [disputeReason, setDisputeReason] = useState('No payment received');
  const [disputeComment, setDisputeComment] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  // Phone Change States
  const [newPhone, setNewPhone] = useState('');
  const [phoneRequest, setPhoneRequest] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [changeOtp, setChangeOtp] = useState('');

  // Photo Change States
  const [photoRequest, setPhotoRequest] = useState(null);
  const [requestedPhoto, setRequestedPhoto] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  // Re-verification states
  const [reAadhaarNumber, setReAadhaarNumber] = useState('');
  const [reAadhaarPhoto, setReAadhaarPhoto] = useState('');
  const [reVerifLoading, setReVerifLoading] = useState(false);
  const [reVerifSuccess, setReVerifSuccess] = useState('');
  const [reVerifError, setReVerifError] = useState('');

  // Sync profile details state from currentUser
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        setEditDescription(currentUser.description || '');
        setEditPhone(currentUser.phone || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const loadRequests = useCallback(async () => {
    try {
      const phoneReq = await authService.getPhoneChangeRequestForUser(currentUser.uid);
      setPhoneRequest(phoneReq);
      const photoReq = await authService.getPhotoChangeRequestForUser(currentUser.uid);
      setPhotoRequest(photoReq);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, [currentUser]);

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);

    const profileData = {
      description: editDescription
    };

    if (!currentUser.phone) {
      const sanitized = editPhone.replace(/[^0-9]/g, '');
      if (sanitized.length !== 10) {
        setProfileError('Please enter a valid 10-digit mobile number.');
        setProfileSaving(false);
        return;
      }
      profileData.phone = `+91${sanitized}`;
    }

    try {
      await updateProfile(profileData);
      setProfileSuccess('Profile updated successfully!');
      setProfileSaving(false);
    } catch (err) {
      console.error(err);
      setProfileError('Failed to save profile. Please try again.');
      setProfileSaving(false);
    }
  };

  const handleRequestPhotoChange = async () => {
    if (!requestedPhoto) return;
    setPhotoError('');
    setPhotoSuccess('');
    setPhotoLoading(true);
    try {
      await authService.requestPhotoChange(
        currentUser.uid,
        currentUser.name || 'User',
        currentUser.profilePhotoUrl || '',
        requestedPhoto
      );
      setPhotoSuccess('Photo change request submitted to Admin successfully.');
      setRequestedPhoto('');
      await loadRequests();
      setPhotoLoading(false);
    } catch (err) {
      console.error(err);
      setPhotoError('Failed to request photo change.');
      setPhotoLoading(false);
    }
  };

  const handleResetPhotoRequest = async () => {
    setPhotoLoading(true);
    try {
      await authService.deletePhotoChangeRequest(currentUser.uid);
      setPhotoRequest(null);
      setRequestedPhoto('');
      setPhotoLoading(false);
    } catch (err) {
      console.error(err);
      setPhotoError('Failed to reset request.');
      setPhotoLoading(false);
    }
  };

  const handleReSubmitVerification = async (e) => {
    e.preventDefault();
    setReVerifError('');
    setReVerifSuccess('');
    
    if (reAadhaarNumber.length !== 12 || !/^[0-9]+$/.test(reAadhaarNumber)) {
      setReVerifError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    if (!reAadhaarPhoto) {
      setReVerifError('Please select or upload your Aadhaar photo.');
      return;
    }

    setReVerifLoading(true);
    try {
      await authService.saveUserProfile(currentUser.uid, {
        aadhaarNumber: reAadhaarNumber,
        aadhaarPhotoUrl: reAadhaarPhoto,
        verificationStatus: 'pending',
        verified: false
      });
      setReVerifSuccess('Identity verification re-submitted successfully!');
      setReAadhaarNumber('');
      setReAadhaarPhoto('');
      await reloadProfile();
      setReVerifLoading(false);
    } catch (err) {
      console.error(err);
      setReVerifError('Failed to re-submit identity verification.');
      setReVerifLoading(false);
    }
  };

  const handleRequestPhoneChange = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    
    const sanitized = newPhone.replace(/[^0-9]/g, '');
    if (sanitized.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return;
    }
    
    const formattedPhone = `+91${sanitized}`;
    if (formattedPhone === currentUser.phone) {
      setPhoneError('New phone number cannot be the same as your current phone number.');
      return;
    }
    
    setPhoneLoading(true);
    try {
      const req = await authService.requestPhoneChange(
        currentUser.uid,
        currentUser.phone || '',
        formattedPhone,
        currentUser.name || 'User'
      );
      setPhoneRequest(req);
      setPhoneSuccess('Change request submitted to Admin successfully.');
      setPhoneLoading(false);
    } catch (err) {
      console.error(err);
      setPhoneError('Failed to request phone change.');
      setPhoneLoading(false);
    }
  };

  const handleSendPhoneChangeOTP = () => {
    setPhoneLoading(true);
    setPhoneError('');
    setPhoneSuccess('');
    setTimeout(() => {
      setOtpSent(true);
      setPhoneSuccess('OTP sent to ' + phoneRequest.newPhone);
      setPhoneLoading(false);
    }, 800);
  };

  const handleVerifyPhoneChangeOTP = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    
    if (changeOtp !== '123456') {
      setPhoneError('Invalid OTP code. Please enter the correct OTP (123456 for testing).');
      return;
    }
    
    setPhoneLoading(true);
    try {
      await authService.completePhoneChange(currentUser.uid, phoneRequest.uid, phoneRequest.newPhone);
      setPhoneSuccess('Phone number updated successfully!');
      setNewPhone('');
      setOtpSent(false);
      setChangeOtp('');
      
      // Reload profile
      await reloadProfile();
      await loadRequests();
      setPhoneLoading(false);
    } catch (err) {
      console.error(err);
      setPhoneError('Failed to update phone number.');
      setPhoneLoading(false);
    }
  };

  const handleResetPhoneRequest = async () => {
    setPhoneLoading(true);
    try {
      await authService.deletePhoneChangeRequest(currentUser.uid);
      setPhoneRequest(null);
      setNewPhone('');
      setOtpSent(false);
      setChangeOtp('');
      setPhoneLoading(false);
    } catch (err) {
      console.error(err);
      setPhoneError('Failed to reset request.');
      setPhoneLoading(false);
    }
  };

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load jobs based on filters
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs(filterCity, filterArea);
      setJobs(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [filterCity, filterArea]);

  // Load worker applications
  const loadApplications = useCallback(async () => {
    try {
      const data = await applicationService.getWorkerApplications(currentUser.uid);
      setMyApplications(data);
    } catch (err) {
      console.error(err);
    }
  }, [currentUser]);

  // Load worker reviews
  const loadReviews = useCallback(async () => {
    try {
      const data = await reviewService.getUserReviews(currentUser.uid);
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  }, [currentUser]);

  // Real-time listener for notifications
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = notificationService.getUserNotifications(currentUser.uid, (data) => {
      setNotifications(data);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  // Load initial data and reload on tab switches
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'home') {
        loadJobs();
      } else if (activeTab === 'applications') {
        loadApplications();
      } else if (activeTab === 'profile') {
        loadReviews();
        reloadProfile();
        loadRequests();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, filterCity, filterArea, loadJobs, loadApplications, loadReviews, reloadProfile, loadRequests]);

  // Handle availability toggle
  const handleAvailabilityToggle = async () => {
    try {
      setAvailLoading(true);
      await updateProfile({ availability: !currentUser.availability });
      setAvailLoading(false);
    } catch (err) {
      console.error(err);
      setAvailLoading(false);
    }
  };

  // Query states & handler
  const [queryText, setQueryText] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [querySuccess, setQuerySuccess] = useState('');
  const [queryError, setQueryError] = useState('');

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setQueryError('');
    setQuerySuccess('');
    
    if (!queryText.trim()) {
      setQueryError('Please enter a query message.');
      return;
    }

    try {
      setQueryLoading(true);
      await queryService.submitQuery(
        currentUser.uid,
        currentUser.name || 'User',
        currentUser.phone || '',
        currentUser.role,
        queryText
      );
      setQuerySuccess('Query sent to Admin successfully!');
      setQueryText('');
      setTimeout(() => setQuerySuccess(''), 3000);
      setQueryLoading(false);
    } catch (err) {
      console.error(err);
      setQueryError('Failed to send query.');
      setQueryLoading(false);
    }
  };

  // Apply to a job
  const handleApplyJob = async (jobId) => {
    if (!currentUser.verified) return;
    try {
      setLoading(true);
      await applicationService.applyForJob(jobId, currentUser);
      // Refresh jobs list & applications list
      await loadJobs();
      await loadApplications();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Start Job Work
  const handleStartWork = async (jobId) => {
    try {
      setLoading(true);
      await jobService.startJobWork(jobId);
      await loadApplications();
      setLoading(false);
    } catch (err) {
      console.error("Failed to start job:", err);
      setLoading(false);
    }
  };

  // Mark Work Completed
  const handleMarkWorkCompleted = async (jobId) => {
    try {
      setLoading(true);
      await jobService.markJobWorkCompleted(jobId);
      await loadApplications();
      setLoading(false);
    } catch (err) {
      console.error("Failed to mark work completed:", err);
      setLoading(false);
    }
  };

  // Confirm Payment
  const handleConfirmPayment = async (jobId, received, reason = '', comment = '') => {
    try {
      setLoading(true);
      await jobService.confirmPayment(jobId, received, reason, comment);
      await loadApplications();
      setLoading(false);
      setIsDisputeOpen(false);
    } catch (err) {
      console.error("Failed to confirm payment:", err);
      setLoading(false);
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // 1. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job => 
        (job.title && job.title.toLowerCase().includes(q)) ||
        (job.description && job.description.toLowerCase().includes(q)) ||
        (job.location && job.location.toLowerCase().includes(q))
      );
    }

    return result;
  }, [jobs, searchQuery]);

  const filteredApplications = useMemo(() => {
    let result = [...myApplications];

    // 1. Text Search Query
    if (appSearchQuery.trim()) {
      const q = appSearchQuery.toLowerCase();
      result = result.filter(app => 
        (app.jobTitle && app.jobTitle.toLowerCase().includes(q)) ||
        (app.employerName && app.employerName.toLowerCase().includes(q)) ||
        (app.jobLocation && app.jobLocation.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (appStatusFilter !== 'all') {
      if (appStatusFilter === 'pending') {
        result = result.filter(app => app.status === 'pending');
      } else if (appStatusFilter === 'booked') {
        result = result.filter(app => app.status === 'selected' && app.jobStatus !== 'completed');
      } else if (appStatusFilter === 'completed') {
        result = result.filter(app => app.status === 'selected' && app.jobStatus === 'completed');
      }
    }

    return result;
  }, [myApplications, appSearchQuery, appStatusFilter]);

  // Notification Mark Read
  const handleMarkNotifRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead(currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6 flex flex-col justify-between">
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Verification Status Warning Banners */}
          {!currentUser.verified && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-left shadow-sm ${
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
                    ? t('pendingVerificationDescWorker')
                    : t('rejectedVerificationDescWorker')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: Job Feed */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left & Center Columns: Job Feed */}
              <div className="md:col-span-2 flex flex-col gap-6">
                {/* Availability Panel */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 text-sm">{t('myAvailability')}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {currentUser.availability 
                        ? t('availableDesc')
                        : t('busyDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAvailabilityToggle}
                    disabled={availLoading}
                    className={`text-xs font-bold px-4 py-2.5 rounded-lg border shadow-sm transition-all touch-target flex items-center justify-center ${
                      currentUser.availability 
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {availLoading ? t('updating') : currentUser.availability ? t('available') : t('busy')}
                  </button>
                </div>

                {/* Search & Filter Panel */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <SlidersHorizontal size={16} className="text-primary" />
                    {t('filterHyperlocalJobs')}
                  </h3>

                  {/* 1. Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('searchJobs')}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* 2. City & Area Selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="feedCity" className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">{t('city')}</label>
                      <select
                        id="feedCity"
                        value={filterCity}
                        onChange={(e) => {
                          setFilterCity(e.target.value);
                          setFilterArea('');
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:border-primary focus:outline-none touch-target cursor-pointer"
                      >
                        <option value="">{t('allCities')}</option>
                        {CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="feedArea" className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">{t('area')}</label>
                      <select
                        id="feedArea"
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:border-primary focus:outline-none touch-target cursor-pointer"
                        disabled={!filterCity}
                      >
                        <option value="">{t('allAreas')}</option>
                        {filterCity && LOCATIONS[filterCity]?.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Jobs List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                      {t('jobsIn')} {filterArea || filterCity || t('allLocations')} ({filteredAndSortedJobs.length})
                    </h2>
                    <button 
                      type="button" 
                      onClick={loadJobs} 
                      className="text-xs font-bold text-primary hover:underline touch-target cursor-pointer"
                    >
                      {t('refreshFeed')}
                    </button>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2].map((n) => (
                        <div key={n} className="bg-white border border-slate-100 p-4 rounded-xl animate-pulse h-40 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-200 rounded w-full"></div>
                          </div>
                          <div className="h-8 bg-slate-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredAndSortedJobs.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                      <Briefcase size={36} className="text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">
                        {jobs.length === 0 ? t('noActiveJobsFound') : "No jobs found matching your criteria."}
                      </p>
                      <p className="text-xs text-slate-400">
                        {jobs.length === 0 ? t('changeFilterDesc') : "Try resetting your search query or filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredAndSortedJobs.map((job) => {
                        const isApplied = myApplications.some(app => app.jobId === job.id);
                        const appStatus = myApplications.find(app => app.jobId === job.id)?.status;
                        
                        return (
                          <JobCard
                            key={job.id}
                            job={job}
                            userRole="worker"
                            isApplied={isApplied}
                            applicationStatus={appStatus}
                            isUserVerified={currentUser.verified}
                            onApply={handleApplyJob}
                            onViewEmployerProfile={handleViewEmployerProfile}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Query Admin */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <MessageSquare className="text-primary shrink-0" size={18} />
                  <h3 className="font-extrabold text-slate-800 text-sm">💬 Query Admin</h3>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Have any queries or need assistance? Type your message below to notify the WorkLink admin directly.
                </p>

                {queryError && (
                  <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
                    {queryError}
                  </div>
                )}
                {querySuccess && (
                  <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded border border-green-100">
                    {querySuccess}
                  </div>
                )}

                <form onSubmit={handleQuerySubmit} className="flex flex-col gap-3.5 text-xs">
                  <div>
                    <label htmlFor="workerQueryText" className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      Your Message
                    </label>
                    <textarea
                      id="workerQueryText"
                      rows={4}
                      placeholder="Describe your query or issue here..."
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-slate-800"
                      required
                      disabled={queryLoading}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={queryLoading}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer text-center w-full"
                  >
                    {queryLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Applied Jobs */}
          {activeTab === 'applications' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 text-left">
                {t('myApplications')} ({filteredApplications.length})
              </h2>
              {/* Minimized Search & Filter Panel for Applications */}
              {myApplications.length > 0 && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left flex flex-col gap-4 mb-2">
                  {/* Search Bar + Filter Icon Row */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={appSearchQuery}
                        onChange={(e) => setAppSearchQuery(e.target.value)}
                        placeholder={t('searchJobs')}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAppFilters(!showAppFilters)}
                      className={`px-3 py-2.5 border ${
                        appStatusFilter !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 text-slate-700 bg-white'
                      } rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center`}
                      title="Filter by Status"
                    >
                      <Filter size={16} />
                    </button>
                  </div>

                  {/* Filter Tags Panel */}
                  {showAppFilters && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {[
                        { id: 'all', label: t('all') },
                        { id: 'pending', label: t('pending') },
                        { id: 'booked', label: t('bookedFilled') },
                        { id: 'completed', label: t('completed') }
                      ].map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setAppStatusFilter(tag.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            appStatusFilter === tag.id
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {myApplications.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                  <Briefcase size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">{t('youHaventApplied')}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg touch-target cursor-pointer"
                  >
                    {t('browseJobsFeed')}
                  </button>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                  <Briefcase size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No applications match your search criteria.</p>
                  <p className="text-xs text-slate-400 font-medium">Try resetting your search query or status filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4 text-left shadow-sm flex flex-col gap-3.5">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">{app.jobTitle}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          app.status === 'selected' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : app.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {app.jobLocation}</div>
                        <div className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {t('applied')}: {new Date(app.appliedAt).toLocaleDateString('en-IN')}</div>
                        {app.employerName && (
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                            <User size={14} className="text-slate-400" />
                            <span>{t('postedBy')}:</span>
                            <button
                              type="button"
                              onClick={() => handleViewEmployerProfile(app.employerId)}
                              className="font-bold text-primary hover:underline hover:text-primary-dark cursor-pointer text-left focus:outline-none"
                            >
                              {app.employerName}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Selected actions (Workflow Integration) */}
                      {app.status === 'selected' && (
                        <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                          <span className="text-[11px] font-bold text-green-600 block">✓ {t('youHaveBeenSelected')}</span>
                          
                          {/* Stepper helper buttons */}
                          <div className="flex flex-col gap-2">
                            {(app.jobStatus === 'ACCEPTED' || app.jobStatus === 'booked') && (
                              <button
                                type="button"
                                onClick={() => handleStartWork(app.jobId)}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs shadow-sm cursor-pointer"
                              >
                                Start Work
                              </button>
                            )}

                            {app.jobStatus === 'WORK_STARTED' && (
                              <button
                                type="button"
                                onClick={() => handleMarkWorkCompleted(app.jobId)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm cursor-pointer"
                              >
                                Mark Work Completed
                              </button>
                            )}

                            {app.jobStatus === 'WORK_COMPLETED' && (
                              <div className="bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold py-2.5 px-3 rounded-xl text-center">
                                Work completed! Waiting for employer payment.
                              </div>
                            )}

                            {/* Worker Verification Screen */}
                            {app.jobStatus === 'EMPLOYER_MARKED_PAID' && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200 pb-1.5">Verify UPI Payment</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs leading-normal">
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Amount Paid</span>
                                    <span className="font-extrabold text-slate-800 text-sm">₹{app.paymentAmount || app.jobPayment}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Transaction ID</span>
                                    <span className="font-mono font-bold text-slate-800">{app.transactionReferenceId || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1 border-t border-slate-200/50">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDisputeJobId(app.jobId);
                                      setIsDisputeOpen(true);
                                    }}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 font-bold py-2 rounded-xl text-xs cursor-pointer text-center"
                                  >
                                    Not Received
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmPayment(app.jobId, true)}
                                    className="flex-1 bg-green-650 hover:bg-green-750 text-white font-bold py-2 rounded-xl text-xs shadow-sm cursor-pointer text-center"
                                  >
                                    Received
                                  </button>
                                </div>
                              </div>
                            )}

                            {app.jobStatus === 'DISPUTED' && (
                              <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold py-2.5 px-3 rounded-xl text-center flex items-center justify-center gap-1.5">
                                <ShieldAlert size={14} className="text-red-600 shrink-0" />
                                <span>Dispute Raised: Awaiting Admin Resolution</span>
                              </div>
                            )}

                            {(app.jobStatus === 'COMPLETED' || app.jobStatus === 'completed') && (
                              <div className="space-y-2">
                                <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-bold py-2.5 px-3 rounded-xl text-center">
                                  ✓ Job completed & payment verified!
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleViewEmployerProfile(app.employerId)}
                                  className="w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 rounded-lg text-xs transition-colors touch-target flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Star size={14} className="fill-primary" />
                                  {t('rateReviewEmployer')}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Contact buttons */}
                          {app.jobStatus !== 'COMPLETED' && app.jobStatus !== 'completed' && (
                            <div className="flex gap-2">
                              <a 
                                href={`tel:${app.employerPhone}`} 
                                className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 touch-target"
                              >
                                <Phone size={14} />
                                {t('callEmployer')}
                              </a>
                              <a 
                                href={`https://wa.me/${app.employerPhone?.replace(/[^0-9]/g, '')}?text=Hello, I am ready to work for "${app.jobTitle}"!`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-center bg-[#25D366] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 touch-target"
                              >
                                <MessageSquare size={14} />
                                {t('whatsapp')}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t('inAppAlerts')} ({notifications.length})
                </h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-primary hover:underline touch-target cursor-pointer"
                  >
                    {t('markAllRead')}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                  <Bell size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">{t('allCaughtUp')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {notifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onMarkRead={handleMarkNotifRead}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Profile & Reviews */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 text-left">
              {currentUser.verificationStatus === 'rejected' && (
                <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-red-800 text-sm flex items-center gap-1.5">
                    <ShieldAlert size={18} />
                    Re-Submit Identity Verification (Aadhaar)
                  </h4>
                  <p className="text-slate-650 text-xs leading-relaxed">
                    Your previous identity verification was rejected by the admin. Please upload a clear photo of your Aadhaar card and verify your 12-digit Aadhaar number to request re-approval.
                  </p>
                  
                  {reVerifError && (
                    <div className="bg-red-100 text-red-800 text-xs font-semibold p-2.5 rounded border border-red-200">
                      {reVerifError}
                    </div>
                  )}
                  {reVerifSuccess && (
                    <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded border border-green-100">
                      {reVerifSuccess}
                    </div>
                  )}

                  <form onSubmit={handleReSubmitVerification} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label htmlFor="reAadhaar" className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                          12-Digit Aadhaar Number
                        </label>
                        <input
                          id="reAadhaar"
                          type="text"
                          placeholder="1234 5678 9012"
                          value={reAadhaarNumber}
                          onChange={(e) => setReAadhaarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                          maxLength={12}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={reVerifLoading}
                        className="w-full bg-red-600 hover:bg-red-750 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer mt-auto"
                      >
                        {reVerifLoading ? 'Submitting...' : 'Re-Submit Aadhaar Info'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Upload Aadhaar Card Photo
                      </label>
                      <div className="relative border border-dashed border-slate-300 hover:border-red-500 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 transition-all h-24">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setReAadhaarPhoto)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          required={!reAadhaarPhoto}
                        />
                        {reAadhaarPhoto ? (
                          <div className="text-center w-full">
                            <img src={reAadhaarPhoto} alt="Re-Aadhaar preview" className="max-h-16 mx-auto rounded border border-slate-200 mb-0.5" />
                            <span className="text-[9px] text-green-600 font-semibold block">✓ Aadhaar Card Uploaded</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-semibold text-slate-500">Select Aadhaar Image</span>
                            <span className="text-[9px] text-slate-400">PNG or JPG formats</span>
                          </>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* User Bio Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <img 
                  src={currentUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={currentUser.name || t('worker')} 
                  className="w-20 h-20 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex justify-center sm:justify-start items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileSuccess('');
                        setProfileError('');
                        setIsEditProfileOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit3 size={13} className="text-slate-400" />
                      <span>{t('editProfile')}</span>
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-mono block mt-1">{currentUser.phone}</span>
                  {currentUser.description && (
                    <p className="text-xs text-slate-655 mt-2 italic font-medium leading-relaxed">
                      "{currentUser.description}"
                    </p>
                  )}
                  <div className="flex justify-center sm:justify-start items-center gap-2 mt-2.5">
                    <RatingStars rating={currentUser.rating} size={15} />
                    <span className="text-xs text-slate-400 font-medium">{t('reviewsCount', { count: currentUser.ratingCount || 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  {t('mySkills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentUser.skills?.map(skill => (
                    <span key={skill} className="bg-primary/5 text-primary border border-primary/10 text-xs font-bold px-3 py-1.5 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  {t('employerFeedback')} ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">{t('noReviewsReceived')}</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-slate-50 pb-3 last:border-b-0 last:pb-0 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800 text-xs">{rev.reviewerName}</strong>
                          <RatingStars rating={rev.rating} size={12} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold italic">Job: "{rev.jobTitle}"</span>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">"{rev.comment}"</p>
                        <span className="text-[9px] text-slate-400 block mt-1">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNav 
        role="worker" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadCount={unreadCount} 
      />

      <ProfileViewModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        targetUserId={selectedEmployerId}
        currentUserId={currentUser.uid}
        currentUserName={currentUser.name}
        canWriteReview={canReviewEmployer}
      />

      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title={t('editProfileSettings')}
      >
        <div className="flex flex-col gap-5 text-left">
          {/* Edit Profile Details Form */}
          <div className="flex flex-col gap-4">
            {profileError && (
              <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100 mb-1">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="bg-green-50 text-green-700 text-xs font-semibold p-3 rounded-lg border border-green-100 mb-1">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              {/* Blocked Name Input */}
              <div>
                <label htmlFor="disabledName" className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                  {t('fullNameIdentityLock')}
                </label>
                <div>
                  <input
                    id="disabledName"
                    type="text"
                    value={currentUser.name}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-450 cursor-not-allowed"
                  />
                  <span className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1.5">
                    <ShieldAlert size={10} className="shrink-0" />
                    <span>{t('blockedNameWarning')}</span>
                  </span>
                </div>
              </div>

              {/* Mobile Number (if missing) */}
              {!currentUser.phone && (
                <div>
                  <label htmlFor="directPhone" className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase">
                    Add Mobile Number (for WhatsApp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
                    <input
                      id="directPhone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      maxLength={10}
                      className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Profile Description */}
              <div>
                <label htmlFor="description" className="block text-[10px] font-bold text-slate-755 mb-1.5 uppercase">
                  {t('profileBio')}
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder={t('bioPlaceholder')}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                {profileSaving ? t('savingChanges') : t('saveProfileDetails')}
              </button>
            </form>

            {/* Profile Photo Request Section */}
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-1.5">
                🖼️ Profile Photo Update Request
              </h4>
              {photoError && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
                  {photoError}
                </div>
              )}
              {photoSuccess && (
                <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded border border-green-100">
                  {photoSuccess}
                </div>
              )}

              {!photoRequest ? (
                <div className="flex flex-col gap-3">
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Profile photos must be approved by an administrator to ensure they are professional and clear.
                  </p>
                  <div className="relative border border-dashed border-slate-300 hover:border-primary rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-white transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setRequestedPhoto)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {requestedPhoto ? (
                      <div className="text-center w-full">
                        <img src={requestedPhoto} alt="Requested profile preview" className="w-12 h-12 rounded-full object-cover mx-auto border border-slate-200 mb-1" />
                        <span className="text-[10px] text-green-600 font-semibold block">✓ Selected</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">Select New Profile Photo</span>
                    )}
                  </div>
                  {requestedPhoto && (
                    <button
                      type="button"
                      onClick={handleRequestPhotoChange}
                      disabled={photoLoading}
                      className="bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs transition-colors w-full cursor-pointer"
                    >
                      {photoLoading ? 'Submitting Request...' : 'Submit Photo Change Request'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      photoRequest.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : photoRequest.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {photoRequest.status}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Active Photo Request</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Current Photo</span>
                      <img src={photoRequest.oldPhotoUrl || currentUser.profilePhotoUrl} alt="Old profile" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    </div>
                    <span className="text-slate-400 font-bold">→</span>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Requested Photo</span>
                      <img src={photoRequest.newPhotoUrl} alt="New profile" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    </div>
                  </div>

                  {photoRequest.status === 'pending' && (
                    <p className="text-[10px] text-slate-500 text-center italic">
                      Awaiting administrator approval. You will be notified once reviewed.
                    </p>
                  )}

                  {photoRequest.status === 'rejected' && (
                    <button
                      type="button"
                      onClick={handleResetPhotoRequest}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded-lg text-[10px] transition-colors w-full cursor-pointer"
                    >
                      Request Again / Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Update Phone Number Card */}
          <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
            <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-1.5">
              {"📞 " + t('updateMobileNumber')}
            </h4>
            
            {phoneError && (
              <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100">
                {phoneError}
              </div>
            )}
            {phoneSuccess && (
              <div className="bg-green-50 text-green-700 text-xs font-semibold p-3 rounded-lg border border-green-100">
                {phoneSuccess}
              </div>
            )}

            {/* None state (no active change request) */}
            {!phoneRequest && (
              <form onSubmit={handleRequestPhoneChange} className="flex flex-col gap-3">
                <p className="text-slate-500 text-xs leading-relaxed">
                  {t('requestPhoneChangeDesc')}
                </p>
                <div>
                  <label htmlFor="newPhoneInput" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{t('newMobileNumber')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
                    <input
                      id="newPhoneInput"
                      type="tel"
                      placeholder={t('enter10Digit')}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      maxLength={10}
                      className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs transition-colors w-full cursor-pointer"
                >
                  {phoneLoading ? t('sending') : t('requestUpdateInfo')}
                </button>
              </form>
            )}

            {/* Pending Approval state */}
            {phoneRequest && phoneRequest.status === 'pending' && (
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                  <span>{t('requestPendingAdmin')}</span>
                </div>
                <p className="text-xs text-slate-655">
                  {t('requestedUpdateTo')} <strong>{phoneRequest.newPhone}</strong>.
                </p>
                <span className="text-[10px] text-slate-400">
                  {t('submitted')}: {new Date(phoneRequest.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            )}

            {/* Approved state (OTP entry) */}
            {phoneRequest && phoneRequest.status === 'approved' && (
              <div className="bg-green-50/50 border border-green-200 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
                  <span>{t('phoneChangeApproved')}</span>
                </div>
                <p className="text-xs text-slate-655">
                  {t('adminApprovedPhoneChange', { phone: phoneRequest.newPhone })}
                </p>
                
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendPhoneChangeOTP}
                    disabled={phoneLoading}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs transition-colors w-full cursor-pointer"
                  >
                    {phoneLoading ? t('sending') : t('sendOtpToNew')}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyPhoneChangeOTP} className="flex flex-col gap-3 border-t border-green-100 pt-3">
                    <div>
                      <label htmlFor="phoneChangeOtp" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        {t('sixDigitVerification')}
                      </label>
                      <input
                        id="phoneChangeOtp"
                        type="text"
                        placeholder={t('enterOtpCode')}
                        value={changeOtp}
                        onChange={(e) => setChangeOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-center font-bold tracking-widest text-slate-800"
                        maxLength={6}
                        required
                      />
                      <span className="text-[10px] text-slate-450 block mt-1">
                        {t('testHelperOtp')}
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={phoneLoading}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs transition-colors w-full cursor-pointer"
                    >
                      {phoneLoading ? t('verifying') : t('verifyOtpComplete')}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Rejected state */}
            {phoneRequest && phoneRequest.status === 'rejected' && (
              <div className="bg-red-50/50 border border-red-200 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-red-700 font-bold">
                  <span>{t('requestRejectedAdmin')}</span>
                </div>
                <p className="text-xs text-slate-655">
                  {t('adminRejectedPhoneChange', { phone: phoneRequest.newPhone })}
                </p>
                <button
                  type="button"
                  onClick={handleResetPhoneRequest}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded-lg text-xs transition-colors w-full cursor-pointer"
                >
                  {t('requestAgain')}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* DISPUTE MODAL */}
      <Modal
        isOpen={isDisputeOpen}
        onClose={() => {
          setIsDisputeOpen(false);
          setDisputeError('');
        }}
        title="Raise Payment Dispute"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            You are raising a payment dispute. The WorkLink admin will review the job details, UPI reference, and employer comments to resolve the dispute.
          </p>

          {disputeError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
              {disputeError}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setDisputeError('');
              setDisputeLoading(true);
              try {
                await handleConfirmPayment(disputeJobId, false, disputeReason, disputeComment);
                setDisputeLoading(false);
                setDisputeComment('');
                setDisputeReason('No payment received');
              } catch (err) {
                console.error("Dispute submit failed:", err);
                setDisputeError("Failed to submit dispute request.");
                setDisputeLoading(false);
              }
            }}
            className="flex flex-col gap-4 text-xs font-semibold"
          >
            <div>
              <label htmlFor="disputeReasonSelect" className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                Reason for Dispute
              </label>
              <select
                id="disputeReasonSelect"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold cursor-pointer focus:border-red-500 focus:outline-none"
              >
                <option value="No payment received">No payment received</option>
                <option value="Incorrect amount">Incorrect amount</option>
                <option value="Invalid transaction reference">Invalid transaction reference</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="disputeCommentText" className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                Explain details
              </label>
              <textarea
                id="disputeCommentText"
                rows={3}
                placeholder="Provide additional details or transaction details..."
                value={disputeComment}
                onChange={(e) => setDisputeComment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none font-medium"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsDisputeOpen(false)}
                className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disputeLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center cursor-pointer"
              >
                {disputeLoading ? 'Submitting Dispute...' : 'File Dispute'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default WorkerDashboard;
