import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from'react';
import { useLocation, useNavigate } from'react-router-dom';
import { useAuth } from'../contexts/AuthContext';
import { authService, jobService, applicationService, notificationService } from'../services/db';
import { getDistance, formatDistance, getDefaultCoordinates, getJobUrgentBadge } from'../utils/geo';
import { reverseGeocode } from'../services/geoapify';
import LocationAutocompleteModal from'../components/LocationAutocompleteModal';
import Navbar from'../components/Navbar';
import BottomNav from'../components/BottomNav';
import JobCard from'../components/JobCard';
import NotificationCard from'../components/NotificationCard';
const ProfileViewModal = lazy(() => import('../components/ProfileViewModal'));
import Modal from'../components/Modal';
import { MapPin, Briefcase, Bell, User, Clock, Star, ShieldAlert, MessageSquare, Search, Filter, SlidersHorizontal, Phone, HelpCircle, FileText, LogOut, CheckCircle, Globe, Calendar } from'lucide-react';
import ProfileMenuItem from'../components/ProfileMenuItem';
import { useTranslation } from'react-i18next';

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

const WorkerDashboard = () => {
  const { currentUser, updateProfile, reloadProfile, logout, startTransition, endTransition } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.defaultTab || sessionStorage.getItem('worker_active_tab') || 'home';
  });

  useEffect(() => {
    sessionStorage.setItem('worker_active_tab', activeTab);
  }, [activeTab]);

  const [jobs, setJobs] = useState([]);
 const [myApplications, setMyApplications] = useState([]);
 const [notifications, setNotifications] = useState([]);
 const [loading, setLoading] = useState(false);
 
 // Profile Viewer State
 const [selectedEmployerId, setSelectedEmployerId] = useState(null);
 const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
 const [canReviewEmployer, setCanReviewEmployer] = useState(false);

 const handleViewEmployerProfile = (employerId) => {
 setSelectedEmployerId(employerId);
 const workedWithEmployer = myApplications.some(
 app => app.employerId === employerId && app.status ==='selected' && app.jobStatus?.toLowerCase() ==='completed'
 );
 setCanReviewEmployer(workedWithEmployer);
 setIsProfileModalOpen(true);
 };
 
 // Location States
 const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
 const [showPermissionModal, setShowPermissionModal] = useState(false);
 const [permissionError, setPermissionError] = useState('');
 const [gpsLoading, setGpsLoading] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 
 // Applications Filtering States
 const [appSearchQuery, setAppSearchQuery] = useState('');
 const [appStatusFilter, setAppStatusFilter] = useState('all');
 const [showAppFilters, setShowAppFilters] = useState(false);
 
 // Availability toggle loading helper
 const [availLoading, setAvailLoading] = useState(false);

 // Profile edit states
 const [editDescription, setEditDescription] = useState('');
 const [editPhone, setEditPhone] = useState(currentUser?.phone ||'');
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

 // Direct Profile Photo Edit State
 const [editPhoto, setEditPhoto] = useState('');

 // Help & Terms Modal states
 const [isHelpOpen, setIsHelpOpen] = useState(false);
 const [isTermsOpen, setIsTermsOpen] = useState(false);

 // Geolocation and sorting/filtering states
 const [workerCoords, setWorkerCoords] = useState(null);
 const [filterMaxDistance] = useState('all');
 const [customDistanceRadius] = useState(15);
 const [sortBy] = useState('recent');

 const isLocationExpired = () => {
 if (!currentUser) return false;
 if (!currentUser.formattedAddress || !currentUser.locationUpdatedAt) return true;
 const elapsed = Date.now() - new Date(currentUser.locationUpdatedAt).getTime();
 return elapsed > 24 * 60 * 60 * 1000; // 24 hours
 };

 useEffect(() => {
 if (currentUser && currentUser.role ==='worker') {
 if (!currentUser.formattedAddress || isLocationExpired()) {
 setShowPermissionModal(true);
 }
 }
 }, [currentUser]);

 // Geolocation Permission & Fallback Fetch
 useEffect(() => {
 if (!currentUser) return;
 if (navigator.geolocation) {
 navigator.geolocation.getCurrentPosition(
 (position) => {
 const coords = {
 lat: position.coords.latitude,
 lng: position.coords.longitude
 };
 setWorkerCoords(coords);
 console.log("Worker coordinates loaded via browser geolocation:", coords);
 },
 (error) => {
 console.warn("Geolocation denied/error. Loading profile coordinates:", error.message);
 if (currentUser.latitude && currentUser.longitude) {
 setWorkerCoords({ lat: currentUser.latitude, lng: currentUser.longitude });
 } else {
 const fallback = getDefaultCoordinates(currentUser.city, currentUser.area);
 setWorkerCoords(fallback);
 }
 },
 { enableHighAccuracy: true, timeout: 8000 }
 );
 } else {
 console.warn("Browser does not support Geolocation. Loading profile coordinates.");
 if (currentUser.latitude && currentUser.longitude) {
 setWorkerCoords({ lat: currentUser.latitude, lng: currentUser.longitude });
 } else {
 const fallback = getDefaultCoordinates(currentUser.city, currentUser.area);
 setWorkerCoords(fallback);
 }
 }
 }, [currentUser]);

 const handleLocationSelect = async (loc) => {
 try {
 setLoading(true);
 await updateProfile({
 ...loc,
 location: loc.formattedAddress || `${loc.locality}, ${loc.city}`,
 city: loc.city ||'',
 area: loc.locality || loc.city ||'',
 locationUpdatedAt: new Date().toISOString()
 });
 setWorkerCoords({ lat: loc.latitude, lng: loc.longitude });
 await reloadProfile();
 setShowPermissionModal(false);
 setLoading(false);
 } catch (err) {
 console.error("Failed to update profile location:", err);
 setLoading(false);
 }
 };

 // Sync profile details state from currentUser
 useEffect(() => {
 if (currentUser) {
 const timer = setTimeout(() => {
 setEditDescription(currentUser.description ||'');
 setEditPhone(currentUser.phone ||'');
 setEditPhoto(currentUser.profilePhotoUrl ||'');
 setNewName(currentUser.name ||'');
 setNewUpiId(currentUser.upiId ||'');
 }, 0);
 return () => clearTimeout(timer);
 }
 }, [currentUser]);

 const loadRequests = useCallback(async () => {
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

 try {
 const profileData = {
 description: editDescription
 };

 if (!currentUser.phone) {
 const sanitized = editPhone.replace(/[^0-9]/g,'');
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
 await reloadProfile();
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
      navigate('/login', { replace: true });
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
 currentUser.name ||'',
 newName.trim(),
 currentUser.name ||'User'
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
 setNewName(currentUser.name ||'');
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
 currentUser.upiId ||'',
 newUpiId.trim(),
'',
'',
 currentUser.name ||'User'
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
 setNewUpiId(currentUser.upiId ||'');
 setUpiLoading(false);
 } catch (err) {
 console.error(err);
 setUpiError('Failed to reset request.');
 setUpiLoading(false);
 }
 };



 const handleRequestPhoneChange = async (e) => {
 e.preventDefault();
 setPhoneError('');
 setPhoneSuccess('');
 
 const sanitized = newPhone.replace(/[^0-9]/g,'');
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
 currentUser.phone ||'',
 formattedPhone,
 currentUser.name ||'User'
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
 setPhoneSuccess('OTP sent to' + phoneRequest.newPhone);
 setPhoneLoading(false);
 }, 800);
 };

 const handleVerifyPhoneChangeOTP = async (e) => {
 e.preventDefault();
 setPhoneError('');
 setPhoneSuccess('');
 
 if (changeOtp !=='123456') {
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

 const [jobsLimit, setJobsLimit] = useState(20);
 const observer = useRef();

 const lastJobElementRef = useCallback((node) => {
 if (loading) return;
 if (observer.current) observer.current.disconnect();
 observer.current = new IntersectionObserver((entries) => {
 if (entries[0].isIntersecting && jobs.length >= jobsLimit) {
 setJobsLimit(prev => prev + 20);
 }
 });
 if (node) observer.current.observe(node);
 }, [loading, jobs.length, jobsLimit]);

 // Load jobs based on filters
 const loadJobs = useCallback(async () => {
 try {
 setLoading(true);
 const data = await jobService.getJobs(null, null, jobsLimit);
 setJobs(data);
 setLoading(false);
 } catch (err) {
 console.error(err);
 setLoading(false);
 }
 }, [jobsLimit]);

 const loadApplications = useCallback(async () => {
 try {
 const data = await applicationService.getWorkerApplications(currentUser.uid);
 setMyApplications(data);
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
 if (typeof unsubscribe ==='function') unsubscribe();
 };
 }, [currentUser]);

 // Load initial data and reload on tab switches
 useEffect(() => {
 const timer = setTimeout(() => {
 if (activeTab ==='home') {
 loadJobs();
 } else if (activeTab ==='applications') {
 loadApplications();
 } else if (activeTab ==='profile') {
 reloadProfile();
 loadRequests();
 }
 }, 0);
 return () => clearTimeout(timer);
 }, [activeTab, loadJobs, loadApplications, reloadProfile, loadRequests]);

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

 // Mark Work Completed
 const handleMarkWorkCompleted = async (jobId) => {
 try {
 setLoading(true);
 await jobService.markJobCompletedByWorker(jobId);
 await loadApplications();
 setLoading(false);
 } catch (err) {
 console.error("Failed to mark work completed:", err);
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



 // 3. Distance Filter
 if (workerCoords) {
 // Calculate distance for all jobs first so we can filter and sort
 result = result.map(job => {
 const dist = (job.latitude !== undefined && job.longitude !== undefined)
 ? getDistance(workerCoords.lat, workerCoords.lng, job.latitude, job.longitude)
 : null;
 return { ...job, _distance: dist };
 });

 if (filterMaxDistance !=='all') {
 const maxDist = filterMaxDistance ==='custom' 
 ? customDistanceRadius 
 : parseFloat(filterMaxDistance);
 
 result = result.filter(job => job._distance !== null && job._distance <= maxDist);
 }
 }

 // 4. Sorting
 result.sort((a, b) => {
 if (sortBy ==='distance' && workerCoords) {
 const distA = a._distance !== undefined && a._distance !== null ? a._distance : 999999;
 const distB = b._distance !== undefined && b._distance !== null ? b._distance : 999999;
 return distA - distB;
 }
 
 if (sortBy ==='pay') {
 const payA = a.payment || 0;
 const payB = b.payment || 0;
 return payB - payA;
 }

 if (sortBy ==='urgent') {
 const badgeA = getJobUrgentBadge(a) ? 1 : 0;
 const badgeB = getJobUrgentBadge(b) ? 1 : 0;
 if (badgeA !== badgeB) {
 return badgeB - badgeA;
 }
 const dateA = new Date(a.createdAt || 0);
 const dateB = new Date(b.createdAt || 0);
 return dateB - dateA;
 }

 // Default:'recent'
 const dateA = new Date(a.createdAt || 0);
 const dateB = new Date(b.createdAt || 0);
 return dateB - dateA;
 });

 return result;
 }, [jobs, searchQuery, workerCoords, filterMaxDistance, customDistanceRadius, sortBy]);

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
 if (appStatusFilter !=='all') {
 if (appStatusFilter ==='pending') {
 result = result.filter(app => app.status ==='pending');
 } else if (appStatusFilter ==='booked') {
 result = result.filter(app => app.status ==='selected' && app.jobStatus?.toLowerCase() !=='completed');
 } else if (appStatusFilter ==='completed') {
 result = result.filter(app => app.status ==='selected' && app.jobStatus?.toLowerCase() ==='completed');
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
 currentUser.verificationStatus ==='pending'
 ?'bg-amber-50/70 border-amber-200 text-amber-800'
 :'bg-red-50/70 border-red-200 text-red-800'
 }`}>
 <ShieldAlert className={currentUser.verificationStatus ==='pending' ?'text-amber-600 shrink-0 mt-0.5' :'text-red-600 shrink-0 mt-0.5'} size={18} />
 <div>
 <h4 className="font-bold text-xs uppercase tracking-wide">
 {currentUser.verificationStatus ==='pending' ? t('pendingVerification') : t('unverified')}
 </h4>
 <p className="text-xs mt-1 leading-normal font-medium text-slate-600">
 {currentUser.verificationStatus ==='pending'
 ? t('pendingVerificationDescWorker')
 : t('rejectedVerificationDescWorker')}
 </p>
 {currentUser.verificationStatus ==='rejected' && currentUser.rejectionReason && (
 <p className="text-xs text-red-800 bg-red-100/30 p-2 rounded border border-red-150/20 font-semibold mt-1">
 Reason: {currentUser.rejectionReason}
 </p>
 )}
 </div>
 </div>
 )}

  {/* TAB 1: Job Feed */}
 {activeTab ==='home' && (
 <div className="flex flex-col gap-4 text-left max-w-md mx-auto">
 {/* 1. Hero Banner */}
 <div 
 className="p-5 rounded-[20px] shadow-sm flex flex-col justify-center h-[160px] overflow-hidden border border-purple-100/50 relative bg-slate-50"
 style={{
 backgroundImage:'linear-gradient(to right, rgba(250, 248, 255, 0.67), rgba(243, 238, 255, 0)), url("/worker_bg.png")',
 backgroundSize:'cover',
 backgroundPosition:'center'
 }}
 >
 <div className="flex flex-col justify-center min-w-0 z-10">
 <span className="text-[12px] font-semibold text-slate-500 block mb-1">Good Morning</span>
 <h1 className="text-[30px] font-extrabold text-slate-800 leading-tight truncate" title={currentUser.name}>
 {currentUser.name}
 </h1>
 <span className="text-[14px] font-bold text-primary/80 mt-1 block uppercase tracking-wider">
 {t('Job Seeker')}
 </span>
 </div>
 </div>

 {/* 2. Availability Card */}
 <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center justify-between h-[72px]">
 <span className="font-extrabold text-slate-800 text-[17px]">My Availability</span>
 <label className="ios-switch shrink-0">
 <input
 type="checkbox"
 checked={!!currentUser.availability}
 onChange={handleAvailabilityToggle}
 disabled={availLoading}
 />
 <span className="ios-slider"></span>
 </label>
 </div>

 {/* 3. Search & Location Card */}
 <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex flex-col gap-4">
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 bg-slate-100 p-1.5 rounded-lg flex items-center justify-center">
 <Search size={14} className="stroke-[2.5] text-primary" />
 </span>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search jobs..."
 className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-[16px] text-sm font-semibold bg-slate-50 focus:bg-white focus:border-primary focus:outline-none placeholder:text-slate-400"
 />
 </div>

 <div className="flex items-center justify-between pt-1 border-t border-slate-100">
 <div className="flex items-center gap-2">
 <MapPin size={15} className="text-primary shrink-0" />
 <strong className="text-slate-800 font-bold text-[15px]">
 {(() => {
   const loc = currentUser?.locality || '';
   const city = currentUser?.city || '';
   if (/ward\b/i.test(loc)) {
     return city || 'Your Location';
   }
   return loc || city || 'Your Location';
 })()}
 </strong>
 </div>
 <button
 type="button"
 onClick={() => setIsLocationModalOpen(true)}
 className="text-sm font-bold text-primary cursor-pointer"
 >
 Change
 </button>
 </div>
 </div>

 {/* Jobs List */}
 <div>
 <div className="flex items-end justify-between mb-4 px-1">
 <div>
 <h2 className="text-[20px] font-extrabold text-slate-800 leading-snug">Jobs Near You</h2>
 <span className="text-[13px] font-semibold text-slate-500 block mt-0.5">
 {filteredAndSortedJobs.length} {filteredAndSortedJobs.length === 1 ? 'Job' : 'Jobs'} Available
 </span>
 </div>
 <button 
 type="button" 
 onClick={loadJobs} 
 className="text-sm font-bold text-primary cursor-pointer py-1"
 >
 Refresh
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
 <p className="text-[15px] font-bold text-slate-600">
 {jobs.length === 0 ? t('noActiveJobsFound') : "No jobs found matching your criteria."}
 </p>
 <p className="text-sm font-semibold text-slate-400">
 {jobs.length === 0 ? t('changeFilterDesc') : "Try resetting your search query or filters."}
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {filteredAndSortedJobs.map((job) => {
 const isApplied = myApplications.some(app => app.jobId === job.id);
 const appStatus = myApplications.find(app => app.jobId === job.id)?.status;
 
 return (
 <div key={job.id} id={`job-${job.id}`} className="rounded-2xl">
 <JobCard
 job={job}
 userRole="worker"
 isApplied={isApplied}
 applicationStatus={appStatus}
 isUserVerified={currentUser.verified}
 onApply={handleApplyJob}
 onViewEmployerProfile={handleViewEmployerProfile}
 workerCoords={workerCoords}
 />
 </div>
 );
 })}
 </div>
 )}

 {filteredAndSortedJobs.length > 0 && jobs.length >= jobsLimit && (
 <div className="mt-6 text-center">
 <button
 type="button"
 onClick={() => setJobsLimit(prev => prev + 20)}
 className="bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-sm shadow-sm cursor-pointer touch-target inline-flex items-center gap-1.5"
 >
 Load More Jobs
 </button>
 </div>
 )}
 <div ref={lastJobElementRef} className="h-2"></div>
 </div>
 </div>
 )}

  {/* TAB 2: Applied Jobs */}
 {activeTab ==='applications' && (
 <div className="flex flex-col gap-4">
 <h2 className="text-[20px] font-extrabold text-slate-800 mb-2 text-left">
 {t('myApplications')} <span className="text-[15px] font-bold text-slate-400">({filteredApplications.length})</span>
 </h2>

 {myApplications.length > 0 && (
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left flex flex-col gap-4 mb-2">
 <div className="flex gap-2">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
 <input
 type="text"
 value={appSearchQuery}
 onChange={(e) => setAppSearchQuery(e.target.value)}
 placeholder={t('searchJobs')}
 className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:border-primary focus:outline-none"
 />
 </div>
 <button
 type="button"
 onClick={() => setShowAppFilters(!showAppFilters)}
 className={`px-3 py-2.5 border ${
 appStatusFilter !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 text-slate-700 bg-white'
 } rounded-xl shadow-sm cursor-pointer flex items-center justify-center`}
 title="Filter by Status"
 aria-label="Filter by Status"
 >
 <Filter size={16} />
 </button>
 </div>

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
 className={`px-3 py-1.5 rounded-full text-sm font-bold border cursor-pointer ${
 appStatusFilter === tag.id
 ? 'bg-primary border-primary text-white shadow-sm'
 : 'bg-slate-50 border-slate-200 text-slate-600'
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
 <p className="text-[15px] font-bold text-slate-600">{t('youHaventApplied')}</p>
 <button
 type="button"
 onClick={() => setActiveTab('home')}
 className="text-sm font-bold text-white bg-primary px-5 py-2.5 rounded-xl touch-target cursor-pointer"
 >
 {t('browseJobsFeed')}
 </button>
 </div>
 ) : filteredApplications.length === 0 ? (
 <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
 <Briefcase size={36} className="text-slate-300" />
 <p className="text-[15px] font-bold text-slate-600">No applications match your search.</p>
 <p className="text-sm font-semibold text-slate-400">Try resetting your search or status filters.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {filteredApplications.map((app) => {
 const mappedJob = {
 id: app.jobId,
 title: app.jobTitle,
 location: app.jobLocation,
 payment: app.jobPayment || '—',
 paymentType: app.jobPaymentType,
 workingHours: app.startTime && app.endTime ? `${app.startTime} - ${app.endTime}` : '',
 jobDate: app.jobDate,
 startTime: app.startTime,
 endTime: app.endTime,
 employerName: app.employerName,
 employerPhone: app.employerPhone,
 employerId: app.employerId,
 status: app.jobStatus || 'open',
 createdAt: app.appliedAt,
 };
 return (
 <div key={app.id} className="rounded-2xl">
 <JobCard
 job={mappedJob}
 userRole="worker"
 isApplied={true}
 applicationStatus={app.status}
 isUserVerified={currentUser.verified}
 onApply={handleApplyJob}
 onViewEmployerProfile={handleViewEmployerProfile}
 onConfirmCompletion={handleMarkWorkCompleted}
 workerCoords={workerCoords}
 />
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* TAB 3: Notifications */}
 {activeTab ==='notifications' && (
 <div className="flex flex-col gap-4 text-left">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-[20px] font-extrabold text-slate-800">
 {t('inAppAlerts')} <span className="text-[15px] font-bold text-slate-400">({notifications.length})</span>
 </h2>
 {unreadCount > 0 && (
 <button
 type="button"
 onClick={handleMarkAllRead}
 className="text-sm font-bold text-primary touch-target cursor-pointer"
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
 {activeTab ==='profile' && (
 <div className="flex flex-col gap-6 text-left max-w-xl mx-auto">
 {/* User Bio Card */}
 <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
 {/* Edit Profile button at top-right */}
 <button
 type="button"
 onClick={() => {
 setProfileSuccess('');
 setProfileError('');
 setIsEditProfileOpen(true);
 }}
 className="absolute top-4 right-4 text-xs font-semibold text-primary cursor-pointer"
 >
 {t('editProfile')}
 </button>

 {/* Profile Photo */}
 <img 
 src={currentUser.profilePhotoUrl ||'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
 alt={currentUser.name || t('worker')} 
 className="w-20 h-20 rounded-full object-cover border border-slate-200 shadow-sm"
 />

 {/* User Details Below Profile Photo */}
 <div className="w-full flex flex-col items-center">
 <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1 block">
 {t('Job Seeker')}
 </span>
 
 {/* Verified Badges */}
 <div className="flex items-center justify-center gap-2 mt-2">
 {currentUser.selfieVerified || currentUser.verified ? (
 <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-0.5 rounded border border-green-200">
 <CheckCircle size={10} className="fill-green-600 text-white" /> Verified
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded border border-red-200">
 Unverified
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Categorized Navigation List */}
 <div className="space-y-6">
 {/* ACCOUNT */}
 <div className="space-y-3">
 <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">ACCOUNT</h3>
 <div className="flex flex-col gap-3">
 <ProfileMenuItem
 icon={Calendar}
 title="My Schedule"
 subtitle="View jobs timeline & calendars"
 to="/schedule"
 />
 <ProfileMenuItem
 icon={MapPin}
 title="Saved Locations"
 subtitle="Manage your Home & Work locations"
 to="/profile/locations"
 />
 <ProfileMenuItem
 icon={SlidersHorizontal}
 title="Skills"
 subtitle="Manage your skills"
 to="/profile/skills"
 />
 <ProfileMenuItem
 icon={Globe}
 title="Language"
 subtitle="Choose your preferred language"
 to="/profile/language"
 />
 </div>
 </div>

 {/* SUPPORT */}
 <div className="space-y-3">
 <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">SUPPORT</h3>
 <div className="flex flex-col gap-3">
 <ProfileMenuItem
 icon={HelpCircle}
 title="Help & Support"
 to="/help"
 />
 <ProfileMenuItem
 icon={MessageSquare}
 title="Message Admin"
 to="/profile/query-admin"
 />
 </div>
 </div>

 {/* SECURITY */}
 <div className="space-y-3">
 <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">SECURITY</h3>
 <div className="flex flex-col gap-3">
 <ProfileMenuItem
 icon={ShieldAlert}
 title="Privacy & Security"
 to="/profile/security"
 />
 </div>
 </div>

 {/* LEGAL */}
 <div className="space-y-3">
 <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">LEGAL</h3>
 <div className="flex flex-col gap-3">
 <ProfileMenuItem
 icon={FileText}
 title="Terms & Conditions"
 to="/terms"
 />
 </div>
 </div>

 {/* Logout Button */}
 <div className="pt-4">
 <button
 type="button"
 onClick={handleLogout}
 className="w-full min-h-[56px] text-[#DC2626] border border-[#DC2626] font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-[16px]"
 >
 <LogOut size={18} />
 Logout
 </button>
 </div>
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

 {isProfileModalOpen && (
 <Suspense fallback={null}>
 <ProfileViewModal
 isOpen={isProfileModalOpen}
 onClose={() => setIsProfileModalOpen(false)}
 targetUserId={selectedEmployerId}
 currentUserId={currentUser.uid}
 currentUserName={currentUser.name}
 canWriteReview={canReviewEmployer}
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
 <img src={editPhoto ||'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="Profile photo" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
 <label className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
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
 placeholder={t('bioPlaceholder')}
 value={editDescription}
 onChange={(e) => setEditDescription(e.target.value)}
 className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-primary"
 />
 </div>

 <button
 type="submit"
 disabled={profileSaving}
 className="bg-primary text-white font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
 >
 {profileSaving ? t('savingChanges') : t('saveProfileDetails')}
 </button>
 </form>
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
 You are raising a payment dispute. The Jobink admin will review the job details, UPI reference, and employer comments to resolve the dispute.
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
 className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={disputeLoading}
 className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center cursor-pointer"
 >
 {disputeLoading ?'Submitting Dispute...' :'File Dispute'}
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
 className="bg-green-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
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
 className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
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
 {isLocationModalOpen && (
 <LocationAutocompleteModal
 isOpen={isLocationModalOpen}
 onClose={() => setIsLocationModalOpen(false)}
 onSelect={handleLocationSelect}
 />
 )}

 {/* Geolocation Permission Prompt Modal */}
 {showPermissionModal && (
 <Modal
 isOpen={showPermissionModal}
 onClose={() => {
 if (currentUser?.formattedAddress) {
 setShowPermissionModal(false);
 }
 }}
 title="Location Access Required"
 >
 <div className="flex flex-col gap-4 text-center py-4">
 <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
 <MapPin size={24} />
 </div>
 <div className="space-y-1">
 <h4 className="font-extrabold text-slate-800 text-sm">
 Allow Jobink to access your location to show jobs near you.
 </h4>
 {permissionError && (
 <p className="text-xs text-red-600 font-semibold mt-2 bg-red-50 p-2 rounded-lg border border-red-150">
 {permissionError}
 </p>
 )}
 </div>
 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => {
 setPermissionError('');
 setGpsLoading(true);
 if (navigator.geolocation) {
 navigator.geolocation.getCurrentPosition(
 async (position) => {
 const { latitude, longitude } = position.coords;
 try {
 const result = await reverseGeocode(latitude, longitude);
 if (result) {
 await updateProfile({
 ...result,
 location: result.formattedAddress || `${result.locality}, ${result.city}`,
 city: result.city ||'',
 area: result.locality || result.city ||'',
 locationUpdatedAt: new Date().toISOString()
 });
 setWorkerCoords({ lat: latitude, lng: longitude });
 await reloadProfile();
 setShowPermissionModal(false);
 } else {
 setPermissionError('Failed to geocode your coordinates.');
 }
 } catch (err) {
 console.error(err);
 setPermissionError('Failed to geocode location coordinates.');
 } finally {
 setGpsLoading(false);
 }
 },
 (error) => {
 console.error(error);
 setPermissionError('Location access is required to automatically detect your location.');
 setGpsLoading(false);
 },
 { enableHighAccuracy: true, timeout: 8000 }
 );
 } else {
 setPermissionError('Your browser does not support geolocation.');
 setGpsLoading(false);
 }
 }}
 disabled={gpsLoading}
 className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-450"
 >
 {gpsLoading ?'Detecting...' :'Enable Location'}
 </button>
 <button
 type="button"
 onClick={() => {
 setIsLocationModalOpen(true);
 }}
 disabled={gpsLoading}
 className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
 >
 Choose Location
 </button>
 </div>
 </div>
 </Modal>
 )}
 </div>
 );
};

export default WorkerDashboard;
