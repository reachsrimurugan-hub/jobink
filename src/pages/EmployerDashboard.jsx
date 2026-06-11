import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, jobService, applicationService, notificationService, reviewService, queryService } from '../services/db';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import JobCard from '../components/JobCard';
import NotificationCard from '../components/NotificationCard';
import Modal from '../components/Modal';
import RatingStars from '../components/RatingStars';
import ProfileViewModal from '../components/ProfileViewModal';
import { Plus, Users, MapPin, BadgeCheck, Phone, MessageSquare, Star, Sparkles, CheckCircle2, ShieldAlert, Edit3, PlusCircle, Clipboard, Bell, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import heroImage from '../assets/dashboard.png';
import { useMetadata } from '../hooks/useMetadata';

const EmployerDashboard = () => {
  const { currentUser, updateProfile, reloadProfile } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'home');

  useMetadata(
    "Employer Dashboard - WorkLink",
    "Post job requirements, audit applicant profiles, verify completed tasks, and manage part-time neighborhood hiring on WorkLink."
  );
  const [myJobs, setMyJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  // Profile Viewer State
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [canReviewWorker, setCanReviewWorker] = useState(false);

  const handleViewWorkerProfile = (workerId) => {
    setSelectedWorkerId(workerId);
    const workedWithWorker = myJobs.some(
      job => job.status === 'completed' && job.selectedWorkers?.includes(workerId)
    );
    setCanReviewWorker(workedWithWorker);
    setIsProfileOpen(true);
  };

  // Applicant Modal State
  const [isApplicantsOpen, setIsApplicantsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  // Review Worker Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewJobId, setReviewJobId] = useState(null);
  const [reviewWorkerId, setReviewWorkerId] = useState('');
  const [reviewWorkerName, setReviewWorkerName] = useState('');
  const [workerRating, setWorkerRating] = useState(5);
  const [workerComment, setWorkerComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Profile edit states
  const [editPhoto, setEditPhoto] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Phone Change States
  const [newPhone, setNewPhone] = useState('');
  const [phoneRequest, setPhoneRequest] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [changeOtp, setChangeOtp] = useState('');

  // Sync profile details state from currentUser
  useEffect(() => {
    if (currentUser) {
      setEditPhoto(currentUser.profilePhotoUrl || '');
      setEditDescription(currentUser.description || '');
    }
  }, [currentUser]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const loadPhoneChangeRequest = async () => {
    try {
      const req = await authService.getPhoneChangeRequestForUser(currentUser.uid);
      setPhoneRequest(req);
    } catch (err) {
      console.error("Failed to load phone change request:", err);
    }
  };

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
    try {
      await updateProfile({
        profilePhotoUrl: editPhoto || currentUser.profilePhotoUrl,
        description: editDescription
      });
      setProfileSuccess('Profile updated successfully!');
      setProfileSaving(false);
    } catch (err) {
      console.error(err);
      setProfileError('Failed to save profile. Please try again.');
      setProfileSaving(false);
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
      await loadPhoneChangeRequest();
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

  const loadEmployerData = async () => {
    try {
      setLoading(true);
      const jobsData = await jobService.getMyJobs(currentUser.uid);
      setMyJobs(jobsData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewService.getUserReviews(currentUser.uid);
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

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

  // Load and refresh based on active tabs
  useEffect(() => {
    if (activeTab === 'home' || activeTab === 'jobs') {
      loadEmployerData();
    } else if (activeTab === 'profile') {
      loadReviews();
      reloadProfile();
      loadPhoneChangeRequest();
    }
  }, [activeTab]);

  // Open applicant list modal
  const handleOpenApplicants = async (jobId) => {
    try {
      setSelectedJobId(jobId);
      setIsApplicantsOpen(true);
      setApplicantsLoading(true);
      const data = await applicationService.getJobApplications(jobId);
      setApplicants(data);
      setApplicantsLoading(false);
    } catch (err) {
      console.error(err);
      setApplicantsLoading(false);
    }
  };

  // Select / hire a worker
  const handleSelectWorker = async (workerId) => {
    try {
      setApplicantsLoading(true);
      await applicationService.updateApplicationStatus(selectedJobId, workerId, 'selected');
      // Refresh applicants list and job overview
      const data = await applicationService.getJobApplications(selectedJobId);
      setApplicants(data);
      await loadEmployerData();
      setApplicantsLoading(false);
    } catch (err) {
      console.error(err);
      setApplicantsLoading(false);
    }
  };

  // Reject / deselect a worker
  const handleRejectWorker = async (workerId) => {
    try {
      setApplicantsLoading(true);
      await applicationService.updateApplicationStatus(selectedJobId, workerId, 'rejected');
      const data = await applicationService.getJobApplications(selectedJobId);
      setApplicants(data);
      await loadEmployerData();
      setApplicantsLoading(false);
    } catch (err) {
      console.error(err);
      setApplicantsLoading(false);
    }
  };

  const handleVerifyWorkCompleted = async (jobId, workerId, workerName) => {
    try {
      setApplicantsLoading(true);
      // 1. Update workStatus to completed
      await applicationService.updateWorkStatus(jobId, workerId, 'completed');
      
      // 2. Refresh applicants list and job overview
      const data = await applicationService.getJobApplications(jobId);
      setApplicants(data);
      await loadEmployerData();
      setApplicantsLoading(false);
      
      // 3. Close applicants modal and trigger rating modal
      setIsApplicantsOpen(false);
      setReviewJobId(jobId);
      setReviewWorkerId(workerId);
      setReviewWorkerName(workerName || t('worker'));
      setWorkerRating(5);
      setWorkerComment('');
      setIsReviewOpen(true);
    } catch (err) {
      console.error(err);
      setApplicantsLoading(false);
    }
  };

  // Job marked completed
  const handleMarkJobCompleted = async (jobId) => {
    try {
      setLoading(true);
      await jobService.updateJobStatus(jobId, 'completed');
      await loadEmployerData();
      setLoading(false);

      // Trigger rating process for hired workers
      const job = myJobs.find(j => j.id === jobId);
      if (job && job.selectedWorkers.length > 0) {
        // Just select the first worker to rate for simplicity (or loop through them)
        const workerId = job.selectedWorkers[0];
        // Fetch worker name from application list
        const apps = await applicationService.getJobApplications(jobId);
        const app = apps.find(a => a.workerId === workerId);
        
        setReviewJobId(jobId);
        setReviewWorkerId(workerId);
        setReviewWorkerName(app ? app.workerName : t('worker'));
        setWorkerRating(5);
        setWorkerComment('');
        setIsReviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Submit worker review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!workerComment.trim()) {
      setReviewError(t('pleaseProvideComment'));
      return;
    }

    try {
      setReviewLoading(true);
      const job = myJobs.find(j => j.id === reviewJobId);
      await reviewService.submitReview(
        currentUser.uid,
        currentUser.name,
        reviewWorkerId,
        reviewJobId,
        job ? job.title : t('partTimeJob'),
        workerRating,
        workerComment
      );
      setReviewLoading(false);
      setIsReviewOpen(false);
    } catch (err) {
      console.error(err);
      setReviewError(t('submissionFailedTryAgain'));
      setReviewLoading(false);
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId) => {
    if (window.confirm(t('confirmDeleteJob'))) {
      try {
        setLoading(true);
        await jobService.deleteJob(jobId);
        await loadEmployerData();
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
  };

  const handleMarkJobPaid = async (jobId, workerId, jobTitle) => {
    try {
      setLoading(true);
      await jobService.markJobAsPaid(jobId, workerId, jobTitle);
      await loadEmployerData();
      setLoading(false);
    } catch (err) {
      console.error("Failed to mark job as paid:", err);
      setLoading(false);
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead(currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  const activeJobs = myJobs.filter(j => j.status !== 'completed');
  const completedJobs = myJobs.filter(j => j.status === 'completed');

  const filteredJobs = myJobs.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' || 
      job.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

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
                    ? t('pendingVerificationDescEmployer')
                    : t('rejectedVerificationDescEmployer')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: Overview Dashboard */}
          {activeTab === 'home' && (() => {
            const totalApplications = myJobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0);
            return (
              <div className="flex flex-col gap-6 text-left">
                {/* Welcome Back Header */}
                <div className="text-left">
                  <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                    {t('welcomeBackName', { name: currentUser?.name || 'User' })}
                  </h2>
                  <p className="text-slate-500 text-xs font-semibold mt-1">
                    {t('heresWhatHappening')}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Active Requirements */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Clipboard size={22} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('activeRequirements')}</span>
                      <span className="text-3xl font-extrabold text-slate-800 mt-1">{activeJobs.length}</span>
                      <span className="text-[11px] font-bold text-blue-600 mt-2">
                        {activeJobs.length === 0 ? t('youHaveNoActivePosts') : t('youHaveActiveRequirements', { count: activeJobs.length })}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Completed Jobs */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('completedJobs')}</span>
                      <span className="text-3xl font-extrabold text-slate-800 mt-1">{completedJobs.length}</span>
                      <span className="text-[11px] font-bold text-green-600 mt-2">
                        {t('greatJob')}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Applications */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <Users size={22} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('applicants')}</span>
                      <span className="text-3xl font-extrabold text-slate-800 mt-1">{totalApplications}</span>
                      <span className="text-[11px] font-bold text-amber-600 mt-2">
                        {t('totalApplications')}
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Alerts */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <Bell size={22} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('alerts')}</span>
                      <span className="text-3xl font-extrabold text-slate-800 mt-1">{unreadCount}</span>
                      <span className="text-[11px] font-bold text-purple-600 mt-2">
                        {t('unreadAlerts')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner Panel */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-sm">
                  <div className="flex-1 space-y-4 text-left z-10">
                    <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                      {t('needHelpersTitle')}
                    </h3>
                    <p className="text-slate-600 text-sm max-w-lg leading-relaxed font-medium">
                      {t('needHelpersDesc')}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/post-job')}
                      className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-5 rounded-xl text-xs shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2 cursor-pointer touch-target w-full sm:w-auto"
                    >
                      <span>{t('postJobRequirement')}</span>
                      <PlusCircle size={15} />
                    </button>
                  </div>
                  <div className="w-full md:w-1/3 shrink-0 flex justify-center z-10 md:justify-end">
                    <img 
                      src={heroImage} 
                      alt="Helpers illustration" 
                      className="max-h-60 md:max-h-70 w-auto object-contain transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Bottom Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Column 1: Current Open Posts */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                        {t('currentOpenPosts')}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('jobs')}
                        className="text-xs font-bold text-primary hover:underline hover:text-primary-dark cursor-pointer flex items-center gap-1"
                      >
                        {t('viewAll')}
                      </button>
                    </div>
                    <div className="flex flex-col gap-4">
                      {activeJobs.length === 0 ? (
                        <div className="bg-white border border-slate-200 border-dashed p-10 rounded-2xl text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2 min-h-[220px]">
                          <span>{t('noActivePostings')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {activeJobs.slice(0, 2).map(job => (
                            <JobCard
                              key={job.id}
                              job={job}
                              userRole="employer"
                              onViewApplicants={handleOpenApplicants}
                              onMarkCompleted={handleMarkJobCompleted}
                              onDelete={handleDeleteJob}
                              onMarkPaid={handleMarkJobPaid}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Recent Activity */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                        {t('recentActivity')}
                      </h3>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-left min-h-[220px] flex flex-col justify-start">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-xs font-semibold py-8 text-center m-auto">{t('allCaughtUp')}</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {notifications.slice(0, 3).map((notif) => {
                            const isUnread = !notif.read;
                            return (
                              <div key={notif.id} className="flex items-start gap-3 pb-3.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isUnread ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <Bell size={14} />
                                </div>
                                <div className="flex-1">
                                  <h5 className={`text-slate-800 text-xs ${isUnread ? 'font-bold' : 'font-medium'}`}>{notif.title}</h5>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                                    {(() => {
                                      try {
                                        const date = new Date(notif.createdAt);
                                        const now = new Date();
                                        const diffMins = Math.floor((now - date) / 60000);
                                        const diffHours = Math.floor((now - date) / 3600000);
                                        if (diffMins < 1) return t('justNow');
                                        if (diffMins < 60) return t('minutesAgo', { count: diffMins });
                                        if (diffHours < 24) return t('hoursAgo', { count: diffHours });
                                        return date.toLocaleDateString('en-IN');
                                      } catch (e) {
                                        return '';
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Query Admin */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                        💬 Query Admin
                      </h3>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-left min-h-[220px] flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Need assistance or have query regarding listings? Send a direct message to the admin.
                        </p>

                        {queryError && (
                          <div className="bg-red-50 text-red-700 text-[10px] font-semibold p-2 rounded border border-red-100">
                            {queryError}
                          </div>
                        )}
                        {querySuccess && (
                          <div className="bg-green-50 text-green-700 text-[10px] font-semibold p-2 rounded border border-green-100">
                            {querySuccess}
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleQuerySubmit} className="flex flex-col gap-3 text-xs mt-3">
                        <textarea
                          rows={3}
                          placeholder="Type your query here..."
                          value={queryText}
                          onChange={(e) => setQueryText(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-slate-800 text-[11px]"
                          required
                          disabled={queryLoading}
                        />
                        <button
                          type="submit"
                          disabled={queryLoading}
                          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl shadow-sm transition-colors cursor-pointer text-center w-full"
                        >
                          {queryLoading ? 'Sending...' : 'Send Message'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: My Postings List */}
          {activeTab === 'jobs' && (
            <div className="flex flex-col gap-4 text-left">
              {myJobs.length === 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                      {t('allJobPosts')} (0)
                    </h2>
                  </div>
                  <div className="bg-white border border-slate-200 border-dashed p-12 rounded-xl text-center flex flex-col items-center gap-3">
                    <Plus size={36} className="text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">{t('youHaventPosted')}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/post-job')}
                      className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg touch-target cursor-pointer"
                    >
                      {t('createJob')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Search and Filter Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                      {t('allJobPosts')} ({filteredJobs.length})
                    </h2>
                    
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Search Box */}
                      <div className="relative flex-1 min-w-[200px] md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                          type="text"
                          placeholder="Search posts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white shadow-sm transition-all"
                        />
                      </div>
                      
                      {/* Filter Button */}
                      <div className="relative" ref={filterDropdownRef}>
                        <button 
                          type="button"
                          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                          className={`flex items-center gap-1.5 px-4 py-2 border ${
                            statusFilter !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 text-slate-700 bg-white'
                          } text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer h-8.5`}
                        >
                          <Filter size={13} />
                          <span>Filter</span>
                        </button>
                        
                        {showFilterDropdown && (
                          <div className="absolute right-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[150px] animate-in fade-in slide-in-from-top-2 duration-150">
                            {[
                              { value: 'all', label: 'All Statuses' },
                              { value: 'open', label: 'Open' },
                              { value: 'booked', label: 'Booked' },
                              { value: 'completed', label: 'Completed' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setStatusFilter(opt.value);
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold ${
                                  statusFilter === opt.value ? 'text-primary bg-primary/5 font-bold' : 'text-slate-700 hover:bg-slate-50'
                                } transition-colors`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Post Button (Desktop helper) */}
                      <button 
                        type="button"
                        onClick={() => navigate('/post-job')}
                        className="bg-primary text-white text-xs font-bold rounded-xl px-4 py-2 hover:bg-primary-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm h-8.5 shrink-0"
                      >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>{t('addPost')}</span>
                      </button>
                    </div>
                  </div>

                  {filteredJobs.length === 0 ? (
                    <div className="bg-white border border-slate-205 border-dashed p-12 rounded-2xl text-center flex flex-col items-center gap-3">
                      <Search size={36} className="text-slate-300" />
                      <p className="text-sm font-semibold text-slate-500">No matching job posts found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query or filter options.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          userRole="employer"
                          onViewApplicants={handleOpenApplicants}
                          onMarkCompleted={handleMarkJobCompleted}
                          onDelete={handleDeleteJob}
                          onMarkPaid={handleMarkJobPaid}
                        />
                      ))}
                    </div>
                  )}
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
                  <Users size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">{t('noApplicantNotifications')}</p>
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

          {/* TAB 4: Employer Profile */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 text-left">
              {/* User Bio Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <img 
                  src={currentUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={currentUser.name || t('employer')} 
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
                      className="text-[10px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/5 hover:bg-primary/10 border border-primary/15 px-2 py-0.5 rounded transition-colors touch-target cursor-pointer"
                    >
                      <Edit3 size={11} />
                      {t('editProfile')}
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1.5 block">
                    {currentUser.businessType === 'Business' ? t('shopOwner') : t('householdEmployer')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{currentUser.phone}</span>
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

              {/* Reviews Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  {t('workerFeedback')} ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">{t('noRatingsSubmitted')}</p>
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

      {/* Persistent Bottom Bar on Mobile */}
      <BottomNav
        role="employer"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* Floating Action Button (FAB) on Mobile for Posts */}
      {activeTab === 'jobs' && (
        <button
          type="button"
          onClick={() => navigate('/post-job')}
          className="fixed bottom-20 right-4 z-40 bg-primary hover:bg-primary-dark text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden flex items-center justify-center cursor-pointer"
          title={t('createJob')}
        >
          <Plus size={24} />
        </button>
      )}

      {/* MODAL 1: APPLICANT LIST MANAGER */}
      <Modal
        isOpen={isApplicantsOpen}
        onClose={() => setIsApplicantsOpen(false)}
        title={t('manageApplicants')}
      >
        {applicantsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-semibold">
            {t('noApplicationsSubmitted')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applicants.map((app) => (
              <div key={app.id} className="border border-slate-150 p-4 rounded-xl flex flex-col gap-3 text-left">
                {/* Details */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => handleViewWorkerProfile(app.workerId)}
                      className="font-bold text-primary hover:underline hover:text-primary-dark cursor-pointer text-left text-sm focus:outline-none block"
                    >
                      {app.workerName}
                    </button>
                    <div className="flex items-center gap-1.5 mt-1">
                      <RatingStars rating={app.workerRating} size={11} />
                      <span className="text-[10px] text-slate-400">{t('worker')}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    app.status === 'selected' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {app.status}
                  </span>
                </div>

                {/* Skills */}
                {app.workerSkills && app.workerSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {app.workerSkills.map(s => (
                      <span key={s} className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between gap-2">
                  {app.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRejectWorker(app.workerId)}
                        className="flex-1 py-2 text-center bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 touch-target cursor-pointer"
                      >
                        {t('reject')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectWorker(app.workerId)}
                        className="flex-1 py-2 text-center bg-primary hover:bg-primary-dark text-white font-bold rounded-lg text-xs shadow-sm touch-target cursor-pointer"
                      >
                        {t('selectWorker')}
                      </button>
                    </>
                  ) : app.status === 'selected' ? (
                    <div className="flex flex-col gap-2.5 w-full">
                      {/* Hired Worker Work Status */}
                      <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Work Status:</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          app.workStatus === 'started' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : app.workStatus === 'finished'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : app.workStatus === 'completed'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {app.workStatus === 'started' 
                            ? 'Work Started' 
                            : app.workStatus === 'finished'
                              ? 'Finished - Verify Needed'
                              : app.workStatus === 'completed'
                                ? 'Completed & Approved'
                                : 'Not Started'}
                        </span>
                      </div>

                      {/* Verify & Complete Work Button */}
                      {app.workStatus === 'finished' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyWorkCompleted(selectedJobId, app.workerId, app.workerName)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer text-center"
                        >
                          Verify & Mark Completed
                        </button>
                      )}

                      <div className="flex gap-2 w-full">
                        <a 
                          href={`tel:${app.workerPhone}`}
                          className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target cursor-pointer"
                        >
                          <Phone size={13} /> {t('callWorker')}
                        </a>
                        <a 
                          href={`https://wa.me/${app.workerPhone?.replace(/[^0-9]/g, '')}?text=Hello ${app.workerName}, you have been selected for my job post on WorkLink. Please reply.`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-[#25D366] text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target cursor-pointer"
                        >
                          <MessageSquare size={13} /> {t('whatsapp')}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRejectWorker(app.workerId)}
                        className="text-slate-400 hover:text-red-600 text-[10px] text-center font-bold mt-1 block py-1 cursor-pointer"
                      >
                        {t('cancelSelection')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectWorker(app.workerId)}
                      className="w-full py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs touch-target cursor-pointer"
                    >
                      {t('rehire')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* MODAL 2: WORKER FEEDBACK RATING FORM */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`${t('reviewHelper')} - ${reviewWorkerName}`}
      >
        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 text-left">
          {reviewError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100">
              {reviewError}
            </div>
          )}

          <div className="text-center py-2">
            <span className="text-xs text-slate-500 font-bold block mb-2 uppercase">{t('tapToRate')}</span>
            <div className="flex justify-center">
              <RatingStars 
                rating={workerRating} 
                interactive={true} 
                size={28} 
                onChange={(v) => setWorkerRating(v)} 
              />
            </div>
          </div>

          <div>
            <label htmlFor="commentText" className="block text-xs font-bold text-slate-600 mb-1">{t('yourComment')}</label>
            <textarea
              id="commentText"
              rows={3}
              placeholder={t('performancePlaceholder')}
              value={workerComment}
              onChange={(e) => setWorkerComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={reviewLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl text-xs transition-colors touch-target flex justify-center items-center cursor-pointer"
          >
            {reviewLoading ? t('sending') : t('submitFeedback')}
          </button>
        </form>
      </Modal>

      <ProfileViewModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        targetUserId={selectedWorkerId}
        currentUserId={currentUser.uid}
        currentUserName={currentUser.name}
        canWriteReview={canReviewWorker}
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
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-455 cursor-not-allowed"
                  />
                  <span className="text-[9px] text-red-500 font-bold mt-1 block">
                    {t('blockedNameWarning')}
                  </span>
                </div>
              </div>

              {/* Profile Photo File Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 mb-1.5 uppercase">
                  {t('updateProfilePhoto')}
                </label>
                <div className="relative border border-dashed border-slate-300 hover:border-primary rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-white transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setEditPhoto)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {editPhoto ? (
                    <div className="text-center w-full">
                      <img src={editPhoto} alt="Profile preview" className="w-12 h-12 rounded-full object-cover mx-auto border border-slate-200 mb-1" />
                      <span className="text-[10px] text-green-600 font-semibold block">{"✓ " + t('selected')}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-600">{t('selectImageFile')}</span>
                  )}
                </div>
              </div>

              {/* Profile Description */}
              <div>
                <label htmlFor="description" className="block text-[10px] font-bold text-slate-755 mb-1.5 uppercase">
                  {t('profileBio')}
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder={t('employerBioPlaceholder')}
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
          </div>

          {/* Update Phone Number Card */}
          <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
            <h4 className="font-bold text-slate-855 text-xs uppercase tracking-wider flex items-center gap-1.5">
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
    </div>
  );
};

export default EmployerDashboard;
