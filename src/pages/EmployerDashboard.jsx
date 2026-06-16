import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, jobService, applicationService, notificationService, reviewService, queryService, disputeService } from '../services/db';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import JobCard from '../components/JobCard';
import NotificationCard from '../components/NotificationCard';
import Modal from '../components/Modal';
import RatingStars from '../components/RatingStars';
const ProfileViewModal = lazy(() => import('../components/ProfileViewModal'));
import { Plus, Users, MapPin, BadgeCheck, Phone, MessageSquare, Star, Sparkles, CheckCircle2, ShieldAlert, Edit3, PlusCircle, Clipboard, Bell, Search, Filter, Upload, Camera, XCircle, HelpCircle, FileText, ChevronRight, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import heroImage from '../assets/dashboard.webp';
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

const EmployerDashboard = () => {
  const { currentUser, updateProfile, reloadProfile, logout, startTransition, endTransition } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'home');
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
      job => job.status?.toLowerCase() === 'completed' && job.selectedWorkers?.includes(workerId)
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
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
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

  // Name Change States
  const [nameRequest, setNameRequest] = useState(null);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  // UPI Change States
  const [upiRequest, setUpiRequest] = useState(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [upiLoading, setUpiLoading] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [upiSuccess, setUpiSuccess] = useState('');

  // Help & Terms Modal states
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);


  // Re-verification states
  const [reUpiId, setReUpiId] = useState('');
  const [reSelfie, setReSelfie] = useState('');
  const [reVerifLoading, setReVerifLoading] = useState(false);
  const [reVerifSuccess, setReVerifSuccess] = useState('');
  const [reVerifError, setReVerifError] = useState('');

  // Payment Confirmation Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payJobId, setPayJobId] = useState('');
  const [payWorkerId, setPayWorkerId] = useState('');
  const [payJobTitle, setPayJobTitle] = useState('');
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payWorkerProfile, setPayWorkerProfile] = useState(null);
  const [loadingPayWorker, setLoadingPayWorker] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  // Dispute Response Modal States
  const [isDisputeResponseOpen, setIsDisputeResponseOpen] = useState(false);
  const [disputeIdToRespond, setDisputeIdToRespond] = useState('');
  const [disputeExplanationChoice, setDisputeExplanationChoice] = useState('Payment already completed');
  const [disputeExplanationComment, setDisputeExplanationComment] = useState('');
  const [disputeResponseError, setDisputeResponseError] = useState('');
  const [disputeResponseLoading, setDisputeResponseLoading] = useState(false);

  // Sync profile details state from currentUser
  useEffect(() => {
    if (currentUser) {
      setEditPhoto(currentUser.profilePhotoUrl || '');
      setEditDescription(currentUser.description || '');
      setEditPhone(currentUser.phone || '');
      setNewName(currentUser.name || '');
      setNewUpiId(currentUser.upiId || '');
    }
  }, [currentUser]);

  // Register FCM push notifications in the background after dashboard renders
  useEffect(() => {
    if (currentUser?.uid) {
      const timer = setTimeout(() => {
        import('../services/notifications')
          .then(({ initializeNotificationToken }) => {
            initializeNotificationToken(currentUser.uid);
          })
          .catch(err => {
            console.warn("Failed to load notifications service dynamically:", err);
          });
      }, 1500);
      return () => clearTimeout(timer);
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

  const loadRequests = async () => {
    try {
      const phoneReq = await authService.getPhoneChangeRequestForUser(currentUser.uid);
      setPhoneRequest(phoneReq);
      const nameReq = await authService.getNameChangeRequestForUser(currentUser.uid);
      setNameRequest(nameReq);
      const upiReq = await authService.getUpiChangeRequestForUser(currentUser.uid);
      setUpiRequest(upiReq);
    } catch (err) {
      console.error("Failed to load requests:", err);
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

      if (editPhoto && editPhoto.startsWith('data:')) {
        const compressed = await compressImage(editPhoto, 400, 400);
        profileData.profilePhotoUrl = compressed;
      }

      await updateProfile(profileData);
      setProfileSuccess('Profile updated successfully!');
      setProfileSaving(false);
    } catch (err) {
      console.error(err);
      setProfileError('Failed to save profile. Please try again.');
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      startTransition();
      await logout();
      navigate('/login');
      setTimeout(() => {
        endTransition();
      }, 500);
    } catch (err) {
      console.error('Logout error', err);
      endTransition();
    }
  };

  const handleRequestNameChange = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    if (!newName.trim()) {
      setNameError('Please enter a valid name.');
      return;
    }
    if (newName.trim() === currentUser.name) {
      setNameError('New name cannot be the same as your current name.');
      return;
    }
    setNameLoading(true);
    try {
      await authService.requestNameChange(
        currentUser.uid,
        currentUser.name || '',
        newName.trim(),
        currentUser.name || 'User'
      );
      setNameSuccess('Name change request submitted successfully to Admin.');
      await loadRequests();
      setNameLoading(false);
    } catch (err) {
      console.error(err);
      setNameError('Failed to request name change.');
      setNameLoading(false);
    }
  };

  const handleResetNameRequest = async () => {
    setNameLoading(true);
    try {
      await authService.deleteNameChangeRequest(currentUser.uid);
      setNameRequest(null);
      setNameSuccess('');
      setNameError('');
      setNewName(currentUser.name || '');
      setNameLoading(false);
    } catch (err) {
      console.error(err);
      setNameError('Failed to reset request.');
      setNameLoading(false);
    }
  };

  const handleRequestUpiChange = async (e) => {
    e.preventDefault();
    setUpiError('');
    setUpiSuccess('');

    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(newUpiId.trim())) {
      setUpiError('Please enter a valid UPI ID (e.g. username@bank).');
      return;
    }

    setUpiLoading(true);
    try {
      await authService.requestUpiChange(
        currentUser.uid,
        currentUser.upiId || '',
        newUpiId.trim(),
        '',
        '',
        currentUser.name || 'User'
      );
      setUpiSuccess('UPI change request submitted successfully to Admin.');
      await loadRequests();
      setUpiLoading(false);
    } catch (err) {
      console.error(err);
      setUpiError('Failed to request UPI change.');
      setUpiLoading(false);
    }
  };

  const handleResetUpiRequest = async () => {
    setUpiLoading(true);
    try {
      await authService.deleteUpiChangeRequest(currentUser.uid);
      setUpiRequest(null);
      setUpiSuccess('');
      setUpiError('');
      setNewUpiId(currentUser.upiId || '');
      setUpiLoading(false);
    } catch (err) {
      console.error(err);
      setUpiError('Failed to reset request.');
      setUpiLoading(false);
    }
  };

  const handleReSubmitVerification = async (e) => {
    e.preventDefault();
    setReVerifError('');
    setReVerifSuccess('');
    
    // UPI ID simple format check
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(reUpiId.trim())) {
      setReVerifError('Please enter a valid UPI ID (e.g. username@bank).');
      return;
    }

    if (!reSelfie) {
      setReVerifError('Selfie photo is required.');
      return;
    }

    setReVerifLoading(true);
    try {
      // Compress images
      const compressedSelfie = await compressImage(reSelfie, 800, 800);

      await authService.saveUserProfile(currentUser.uid, {
        upiId: reUpiId.trim(),
        upiQrUrl: '',
        upiVerified: false,
        selfieUrl: compressedSelfie,
        selfieVerified: false,
        verificationStatus: 'pending',
        verified: false
      });
      setReVerifSuccess('Trust verification details re-submitted successfully!');
      setReUpiId('');
      setReSelfie('');
      await reloadProfile();
      setReVerifLoading(false);
    } catch (err) {
      console.error(err);
      setReVerifError('Failed to re-submit trust verification details.');
      setReVerifLoading(false);
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

  const loadEmployerData = async () => {
    try {
      setLoading(true);
      await jobService.checkPendingPaymentConfirmationsSim(currentUser.uid, currentUser.role);
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
      loadRequests();
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
    const job = myJobs.find(j => j.id === jobId);
    if (!job) return;

    if (job.selectedWorkers && job.selectedWorkers.length > 0) {
      alert("Cannot delete job because a worker has already been accepted.");
      return;
    }

    let confirmMsg = t('confirmDeleteJob') || "Are you sure you want to delete this job post?";
    if (job.applicants && job.applicants.length > 0) {
      confirmMsg = "Warning: Workers have already applied to this job post. Are you sure you want to delete it?";
    }

    if (window.confirm(confirmMsg)) {
      try {
        setLoading(true);
        await jobService.deleteJob(jobId);
        await loadEmployerData();
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert(err.message || "Failed to delete job.");
        setLoading(false);
      }
    }
  };

  const handleMarkJobPaid = async (jobId, workerId, jobTitle) => {
    const job = myJobs.find(j => j.id === jobId);
    setPayJobId(jobId);
    setPayWorkerId(workerId);
    setPayJobTitle(jobTitle);
    setPaymentAmountInput(job ? job.payment : '');
    setPayError('');
    setPayWorkerProfile(null);
    setIsPayModalOpen(true);

    if (workerId) {
      try {
        setLoadingPayWorker(true);
        const profile = await authService.getCurrentUser(workerId);
        setPayWorkerProfile(profile);
        setLoadingPayWorker(false);
      } catch (err) {
        console.error("Error fetching worker profile for payment modal:", err);
        setLoadingPayWorker(false);
      }
    }
  };

  const submitPaymentDetails = async (e) => {
    e.preventDefault();
    setPayError('');
    const amountNum = Number(paymentAmountInput);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError("Payment Amount must be a positive number.");
      return;
    }
    try {
      setPayLoading(true);
      await jobService.markJobAsPaid(payJobId, amountNum);
      await loadEmployerData();
      setPayLoading(false);
      setIsPayModalOpen(false);
    } catch (err) {
      console.error("Failed to submit payment details:", err);
      setPayError(err.message || "Failed to submit payment details.");
      setPayLoading(false);
    }
  };

  const handleOpenDisputeResponse = (jobId) => {
    setDisputeIdToRespond(`${jobId}_dispute`);
    setDisputeExplanationChoice('Payment already completed');
    setDisputeExplanationComment('');
    setDisputeResponseError('');
    setIsDisputeResponseOpen(true);
  };

  const submitDisputeResponse = async (e) => {
    e.preventDefault();
    setDisputeResponseError('');
    const explanation = `${disputeExplanationChoice}: ${disputeExplanationComment.trim()}`;
    try {
      setDisputeResponseLoading(true);
      await disputeService.submitEmployerResponse(disputeIdToRespond, explanation);
      await loadEmployerData();
      setDisputeResponseLoading(false);
      setIsDisputeResponseOpen(false);
      setDisputeExplanationComment('');
    } catch (err) {
      console.error("Dispute response failed:", err);
      setDisputeResponseError(err.message || "Failed to submit explanation.");
      setDisputeResponseLoading(false);
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

  const activeJobs = myJobs.filter(j => j.status?.toLowerCase() !== 'completed');
  const completedJobs = myJobs.filter(j => j.status?.toLowerCase() === 'completed');

  const filteredJobs = myJobs.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' || 
      job.status?.toLowerCase() === statusFilter.toLowerCase();
      
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
                {currentUser.verificationStatus === 'rejected' && currentUser.rejectionReason && (
                  <p className="text-xs text-red-800 bg-red-100/30 p-2 rounded border border-red-150/20 font-semibold mt-1">
                    Reason: {currentUser.rejectionReason}
                  </p>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                              hideProgress={true}
                              onViewApplicants={handleOpenApplicants}
                              onMarkCompleted={handleMarkJobCompleted}
                              onDelete={handleDeleteJob}
                              onMarkPaid={handleMarkJobPaid}
                              onRespondToDispute={handleOpenDisputeResponse}
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
                              { value: 'ACCEPTED', label: 'Accepted' },
                              { value: 'WORK_STARTED', label: 'Work Started' },
                              { value: 'WORK_COMPLETED', label: 'Work Completed' },
                              { value: 'EMPLOYER_MARKED_PAID', label: 'Marked Paid' },
                              { value: 'DISPUTED', label: 'Disputed' },
                              { value: 'COMPLETED', label: 'Completed' }
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
                          onRespondToDispute={handleOpenDisputeResponse}
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
              {currentUser.verificationStatus === 'rejected' && (
                <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-red-800 text-sm flex items-center gap-1.5">
                    <ShieldAlert size={18} />
                    Re-Submit Trust Verification Details
                  </h4>
                  <p className="text-slate-650 text-xs leading-relaxed">
                    Your previous trust verification details were rejected. Please update your UPI ID, capture a new Selfie, upload your UPI QR code and submit for admin re-approval.
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

                  <form onSubmit={handleReSubmitVerification} className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="reUpiIdInput" className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                          UPI ID
                        </label>
                        <input
                          id="reUpiIdInput"
                          type="text"
                          placeholder="username@bank"
                          value={reUpiId}
                          onChange={(e) => setReUpiId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                          Selfie Verification
                        </label>
                        <div className="border border-dashed border-slate-300 rounded-xl p-2 flex flex-col items-center justify-center gap-2 bg-white h-24 relative">
                          {reSelfie ? (
                            <div className="text-center w-full relative">
                              <img src={reSelfie} alt="Re-Selfie preview" className="w-10 h-10 rounded-full object-cover mx-auto border border-slate-200" />
                              <span className="text-[9px] text-green-600 font-semibold block mt-1">✓ Selfie Selected</span>
                              <button
                                type="button"
                                onClick={() => setReSelfie('')}
                                className="text-[9px] text-red-500 hover:underline font-semibold block mx-auto mt-0.5"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <div className="w-full h-full flex gap-2">
                              {/* Option 1: Take Selfie */}
                              <label className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-1 border border-slate-100 hover:border-primary bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition-all p-1">
                                <Camera size={16} className="text-primary" />
                                <span className="text-[10px] font-bold text-slate-700">Take Selfie</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="user"
                                  onChange={(e) => handleFileChange(e, setReSelfie)}
                                  className="hidden"
                                  required={!reSelfie}
                                />
                              </label>
                              {/* Option 2: Upload Photo */}
                              <label className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-1 border border-slate-100 hover:border-primary bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition-all p-1">
                                <Upload size={16} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-700">Upload Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, setReSelfie)}
                                  className="hidden"
                                  required={!reSelfie}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={reVerifLoading}
                      className="w-full bg-red-600 hover:bg-red-750 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer mt-2"
                    >
                      {reVerifLoading ? 'Submitting...' : 'Re-Submit Verification Details'}
                    </button>
                  </form>
                </div>
              )}

              {/* User Bio Card */}
              <div className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center text-center gap-4">
                {/* Edit Profile button at top-right */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileSuccess('');
                    setProfileError('');
                    setIsEditProfileOpen(true);
                  }}
                  className="absolute top-4 right-4 text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                >
                  {t('editProfile')}
                </button>

                {/* Profile Photo */}
                <img 
                  src={currentUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={currentUser.name || t('employer')} 
                  className="w-20 h-20 rounded-full object-cover border border-slate-200"
                />

                {/* User Details Below Profile Photo */}
                <div className="w-full flex flex-col items-center">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1.5 block">
                    {currentUser.businessType === 'Business' ? t('shopOwner') : t('householdEmployer')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{currentUser.phone}</span>
                  {currentUser.description && (
                    <p className="text-xs text-slate-655 mt-2 italic font-medium leading-relaxed max-w-md">
                      "{currentUser.description}"
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-2.5">
                    <RatingStars rating={currentUser.rating} size={15} />
                    <span className="text-xs text-slate-400 font-medium">{t('reviewsCount', { count: currentUser.ratingCount || 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  Reviews ({reviews.length})
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

              {/* Query Admin Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <MessageSquare className="text-primary shrink-0" size={18} />
                  <h3 className="font-extrabold text-slate-800 text-sm"> Query Admin</h3>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Need assistance or have query regarding listings? Send a direct message to the admin.
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
                  <textarea
                    rows={4}
                    placeholder="Describe your query or issue here..."
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-slate-800"
                    required
                    disabled={queryLoading}
                  />
                  <button
                    type="submit"
                    disabled={queryLoading}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer text-center w-full"
                  >
                    {queryLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>

              {/* Support & Settings Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                  Support & Settings
                </h4>
                <div className="flex flex-col divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="flex items-center justify-between py-3 hover:text-primary transition-colors cursor-pointer text-left w-full"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle size={16} className="text-slate-400" />
                      <span>Help & Support</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(true)}
                    className="flex items-center justify-between py-3 hover:text-primary transition-colors cursor-pointer text-left w-full"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-slate-400" />
                      <span>Terms & Conditions</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-between py-3 text-red-600 hover:text-red-750 hover:bg-red-50/20 transition-colors cursor-pointer text-left w-full rounded-b-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut size={16} className="text-red-500" />
                      <span>Logout</span>
                    </div>
                    <ChevronRight size={14} className="text-red-400" />
                  </button>
                </div>
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
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                        <a 
                          href={`tel:${app.workerPhone}`}
                          className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target cursor-pointer"
                        >
                          <Phone size={13} /> {t('callWorker')}
                        </a>
                        <a 
                          href={`https://wa.me/${app.workerPhone?.replace(/[^0-9]/g, '')}?text=Hello ${app.workerName}, you have been selected for my job post on Jobink. Please reply.`}
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

      {isProfileOpen && (
        <Suspense fallback={null}>
          <ProfileViewModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            targetUserId={selectedWorkerId}
            currentUserId={currentUser.uid}
            currentUserName={currentUser.name}
            canWriteReview={canReviewWorker}
          />
        </Suspense>
      )}

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
              {/* Profile Photo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <img src={editPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="Profile photo" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                  <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    Upload New Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setEditPhoto)}
                      className="hidden"
                    />
                  </label>
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

              <button
                type="submit"
                disabled={profileSaving}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                {profileSaving ? t('savingChanges') : t('saveProfileDetails')}
              </button>
            </form>

            {/* Name Change Request Section */}
            <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
              <h4 className="font-bold text-slate-855 text-xs uppercase tracking-wider">
                Name Change Request
              </h4>
              {nameError && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
                  {nameError}
                </div>
              )}
              {nameSuccess && (
                <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded border border-green-100">
                  {nameSuccess}
                </div>
              )}

              {!nameRequest ? (
                <form onSubmit={handleRequestNameChange} className="flex flex-col gap-3">
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Name changes require administrator approval to ensure your account matches your verified identity.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new full name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      required
                    />
                    <button
                      type="submit"
                      disabled={nameLoading}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                    >
                      {nameLoading ? 'Submitting...' : 'Request'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      nameRequest.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : nameRequest.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {nameRequest.status}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Name Update Request</span>
                  </div>

                  <div className="text-xs text-slate-650">
                    Requested name change: <strong className="text-slate-800">{nameRequest.newName}</strong>
                  </div>

                  {nameRequest.status === 'pending' && (
                    <p className="text-[10px] text-slate-500 italic">
                      Awaiting administrator approval. You will be notified once reviewed.
                    </p>
                  )}

                  {nameRequest.status === 'rejected' && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-700 bg-red-100/50 p-2 rounded-lg border border-red-100 font-semibold">
                        Reason: {nameRequest.rejectionReason || 'No reason provided.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleResetNameRequest}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded-lg text-xs transition-colors w-full cursor-pointer"
                      >
                        Reapply / Reset Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* UPI details Change Request Section */}
            <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
              <h4 className="font-bold text-slate-855 text-xs uppercase tracking-wider">
                UPI Credentials Request
              </h4>
              {upiError && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
                  {upiError}
                </div>
              )}
              {upiSuccess && (
                <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded border border-green-100">
                  {upiSuccess}
                </div>
              )}

              {!upiRequest ? (
                <form onSubmit={handleRequestUpiChange} className="flex flex-col gap-3">
                  <p className="text-slate-500 text-xs leading-relaxed">
                    UPI updates require administrator approval. Provide your UPI ID and scan-to-pay QR image.
                  </p>
                  <div>
                    <label htmlFor="newUpiIdInput" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      New UPI ID (username@bank)
                    </label>
                    <input
                      id="newUpiIdInput"
                      type="text"
                      placeholder="username@bank"
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 mb-2"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={upiLoading}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs transition-colors w-full cursor-pointer mt-1"
                  >
                    {upiLoading ? 'Submitting...' : 'Submit UPI Update Request'}
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      upiRequest.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : upiRequest.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {upiRequest.status}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">UPI Update Request</span>
                  </div>

                  <div className="text-xs text-slate-655 space-y-2">
                    <div>Requested UPI ID: <strong className="text-slate-800 font-mono">{upiRequest.newUpiId}</strong></div>

                  </div>

                  {upiRequest.status === 'pending' && (
                    <p className="text-[10px] text-slate-500 italic">
                      Awaiting administrator approval. You will be notified once reviewed.
                    </p>
                  )}

                  {upiRequest.status === 'rejected' && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-700 bg-red-100/50 p-2 rounded-lg border border-red-100 font-semibold">
                        Reason: {upiRequest.rejectionReason || 'No reason provided.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleResetUpiRequest}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded-lg text-[10px] transition-colors w-full cursor-pointer"
                      >
                        Reapply / Reset Request
                      </button>
                    </div>
                  )}
                </div>
              )}     </div>
          </div>

          {/* Update Phone Number Card */}
          <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
            <h4 className="font-bold text-slate-855 text-xs uppercase tracking-wider flex items-center gap-1.5">
              {t('updateMobileNumber')}
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
                {phoneRequest.rejectionReason && (
                  <p className="text-xs text-red-700 bg-red-100/50 p-2 rounded-lg border border-red-100 font-semibold mt-1">
                    Reason: {phoneRequest.rejectionReason}
                  </p>
                )}
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

      {/* UPI PAYMENT CONFIRMATION MODAL */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setPayError('');
        }}
        title="Confirm UPI Payment"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            Please transfer the job amount directly to the worker's UPI account. Once completed, click <strong>Confirm Paid</strong> to notify the worker. They will verify receipt to close the job.
          </p>

          {payError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
              {payError}
            </div>
          )}

          {loadingPayWorker ? (
            <div className="text-slate-400 animate-pulse text-xs font-semibold py-4 text-center">
              Loading worker UPI details...
            </div>
          ) : payWorkerProfile ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-200/50 pb-2.5">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Worker</span>
                  <span className="font-bold text-slate-800 text-sm">{payWorkerProfile.name}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{payWorkerProfile.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Worker UPI ID</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
                      {payWorkerProfile.upiId || 'Not Provided'}
                    </span>
                    {payWorkerProfile.upiId && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(payWorkerProfile.upiId);
                          setUpiCopied(true);
                          setTimeout(() => setUpiCopied(false), 2000);
                        }}
                        className="text-[9px] font-extrabold text-primary hover:text-primary-dark transition-colors focus:outline-none flex items-center gap-0.5 bg-primary/5 hover:bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {upiCopied ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-red-550 text-xs font-semibold py-2 text-center">
              Failed to load worker details.
            </div>
          )}

          <form onSubmit={submitPaymentDetails} className="flex flex-col gap-4 text-xs font-semibold">
            <div>
              <label htmlFor="paymentJobTitle" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Job Title</label>
              <input
                id="paymentJobTitle"
                type="text"
                value={payJobTitle}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="paymentAmountInput" className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payment Amount (₹)</label>
              <input
                id="paymentAmountInput"
                type="number"
                placeholder="e.g. 500"
                value={paymentAmountInput}
                onChange={(e) => setPaymentAmountInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-primary"
                required
                disabled={payLoading}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center cursor-pointer"
              >
                {payLoading ? 'Saving...' : 'Confirm Paid'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* DISPUTE RESPONSE MODAL */}
      <Modal
        isOpen={isDisputeResponseOpen}
        onClose={() => {
          setIsDisputeResponseOpen(false);
          setDisputeResponseError('');
        }}
        title="Submit Dispute Response"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            Explain your side of the dispute regarding this payment. Provide details of the payment to help the admin audit this transaction.
          </p>

          {disputeResponseError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
              {disputeResponseError}
            </div>
          )}

          <form onSubmit={submitDisputeResponse} className="flex flex-col gap-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Select Response Option</label>
              <div className="flex flex-col gap-2 font-medium">
                {[
                  'Payment already completed',
                  'Payment pending',
                  'Other explanation'
                ].map((choice) => (
                  <label key={choice} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="disputeExplanationChoice"
                      value={choice}
                      checked={disputeExplanationChoice === choice}
                      onChange={() => setDisputeExplanationChoice(choice)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="disputeExplanationComment" className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Detailed Explanation</label>
              <textarea
                id="disputeExplanationComment"
                rows={3}
                placeholder="Explain the payment timeline, reference numbers, or pending details..."
                value={disputeExplanationComment}
                onChange={(e) => setDisputeExplanationComment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary font-medium"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDisputeResponseOpen(false)}
                className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disputeResponseLoading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center cursor-pointer"
              >
                {disputeResponseLoading ? 'Submitting...' : 'Submit Explanation'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Help & Support"
      >
        <div className="flex flex-col gap-4 text-left py-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            Welcome to Jobink Help & Support. If you need any assistance regarding jobs, profile validation, or payments, feel free to contact us.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Support</span>
                <strong className="text-xs text-slate-700 font-mono">+91 99999 99999</strong>
              </div>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Chat Now
              </a>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Support</span>
                <strong className="text-xs text-slate-700 font-mono">support@jobink.in</strong>
              </div>
              <a
                href="mailto:support@jobink.in"
                className="bg-primary hover:bg-primary-dark text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Email Us
              </a>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5">Frequently Asked Questions</h5>
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="pt-2.5 first:pt-0">
                <strong className="text-slate-755 block mb-1">How long does Trust Verification take?</strong>
                <p className="text-slate-500 leading-relaxed">Identity verification by our admin team usually takes 2-4 business hours.</p>
              </div>
              <div className="pt-2.5">
                <strong className="text-slate-755 block mb-1">How are payments processed?</strong>
                <p className="text-slate-500 leading-relaxed">Payments are made directly from employers to workers via UPI once the job is marked as completed.</p>
              </div>
              <div className="pt-2.5">
                <strong className="text-slate-755 block mb-1">What happens if a dispute occurs?</strong>
                <p className="text-slate-500 leading-relaxed">If there is an issue with payment or completion, you can raise a dispute directly from your dashboard to invoke admin review.</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms & Conditions"
      >
        <div className="flex flex-col gap-3 text-left py-2 max-h-[60vh] overflow-y-auto pr-1 text-xs text-slate-600 leading-relaxed">
          <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">1. Introduction</h5>
          <p>
            By using the Jobink platform (WorkLink), you agree to these Terms & Conditions. This platform connects independent workers with household or business employers.
          </p>

          <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mt-2">2. Identity & Verification</h5>
          <p>
            Users must submit true and accurate details (Selfies, Aadhaar details, UPI credentials). Any misrepresentation will result in permanent account suspension and ban.
          </p>

          <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mt-2">3. Job Agreements</h5>
          <p>
            Employers are responsible for providing a safe environment, clear instructions, and timely payments. Workers are responsible for completing the task to the best of their abilities.
          </p>

          <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mt-2">4. Payment & Direct Transfer</h5>
          <p>
            Payments are transacted directly between the Employer and the Worker (Direct UPI transfer). Jobink is a facilitator and does not handle payments directly, escrow, or fee deductions.
          </p>

          <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mt-2">5. Safety & Behavior</h5>
          <p>
            Jobink has zero-tolerance for harassment, violence, non-payment, or platform abuse. Dispute resolutions decided by our admin moderation team are final.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default EmployerDashboard;
