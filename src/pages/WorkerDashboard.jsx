import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService, applicationService, notificationService, reviewService } from '../services/db';
import { CITIES, LOCATIONS } from '../utils/locations';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import JobCard from '../components/JobCard';
import NotificationCard from '../components/NotificationCard';
import RatingStars from '../components/RatingStars';
import ProfileViewModal from '../components/ProfileViewModal';
import { Sparkles, MapPin, Briefcase, Bell, User, CheckCircle, Clock, Star } from 'lucide-react';

const WorkerDashboard = () => {
  const { currentUser, updateProfile, reloadProfile } = useAuth();
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
  
  // Availability toggle loading helper
  const [availLoading, setAvailLoading] = useState(false);

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load jobs based on filters
  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs(filterCity, filterArea);
      setJobs(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Load worker applications
  const loadApplications = async () => {
    try {
      const data = await applicationService.getWorkerApplications(currentUser.uid);
      setMyApplications(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load worker reviews
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

  // Load initial data and reload on tab switches
  useEffect(() => {
    if (activeTab === 'home') {
      loadJobs();
    } else if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'profile') {
      loadReviews();
      reloadProfile(); // Reload user stats (like verification and rating)
    }
  }, [activeTab, filterCity, filterArea]);

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
          {/* TAB 1: Job Feed */}
          {activeTab === 'home' && (
            <div className="flex flex-col gap-6">
              {/* Availability Panel */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-sm">My Availability</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {currentUser.availability 
                      ? "🟢 Available for work. Employers can select you." 
                      : "🔴 Currently working/busy. Hidden from auto-select."}
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
                  {availLoading ? 'Updating...' : currentUser.availability ? 'Available' : 'Busy'}
                </button>
              </div>

              {/* Location Filter */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-left flex flex-col gap-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  Filter Hyperlocal Jobs
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="feedCity" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">City</label>
                    <select
                      id="feedCity"
                      value={filterCity}
                      onChange={(e) => {
                        setFilterCity(e.target.value);
                        setFilterArea('');
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 touch-target"
                    >
                      <option value="">All Cities</option>
                      {CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="feedArea" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Area</label>
                    <select
                      id="feedArea"
                      value={filterArea}
                      onChange={(e) => setFilterArea(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 touch-target"
                      disabled={!filterCity}
                    >
                      <option value="">All Areas</option>
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
                    Jobs in {filterArea || filterCity || "All Locations"} ({jobs.length})
                  </h2>
                  <button 
                    type="button" 
                    onClick={loadJobs} 
                    className="text-xs font-bold text-primary hover:underline touch-target"
                  >
                    Refresh Feed
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
                ) : jobs.length === 0 ? (
                  <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                    <Briefcase size={36} className="text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No active jobs found in this area.</p>
                    <p className="text-xs text-slate-400">Try changing your location filter above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jobs.map((job) => {
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
          )}

          {/* TAB 2: Applied Jobs */}
          {activeTab === 'applications' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 text-left">
                My Applications ({myApplications.length})
              </h2>

              {myApplications.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                  <Briefcase size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">You haven't applied to any jobs yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg touch-target"
                  >
                    Browse Jobs Feed
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myApplications.map((app) => (
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
                        <div className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN')}</div>
                      </div>

                      {/* Selected actions (Active Jobs) */}
                      {app.status === 'selected' && app.jobStatus !== 'completed' && (
                        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                          <span className="text-[11px] font-bold text-green-600 block">✓ You have been selected! Contact the employer:</span>
                          <div className="flex gap-2">
                            <a 
                              href={`tel:${app.workerPhone}`} // Fallback or employer phone
                              className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target"
                            >
                              Call Employer
                            </a>
                            <a 
                              href={`https://wa.me/${app.workerPhone?.replace(/[^0-9]/g, '')}?text=Hello, I am ready to work for "${app.jobTitle}"!`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-center bg-[#25D366] text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Selected actions (Completed Jobs) */}
                      {app.status === 'selected' && app.jobStatus === 'completed' && (
                        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                          <span className="text-[11px] font-bold text-slate-500 block">✓ Work Completed! Feedback is active:</span>
                          <button
                            type="button"
                            onClick={() => handleViewEmployerProfile(app.employerId)}
                            className="w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 rounded-lg text-xs transition-colors touch-target flex items-center justify-center gap-1.5"
                          >
                            <Star size={14} className="fill-primary" />
                            Rate & Review Employer
                          </button>
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
                  In-App Alerts ({notifications.length})
                </h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-primary hover:underline touch-target"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                  <Bell size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">All caught up! No notifications.</p>
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
              {/* User Bio Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <img 
                  src={currentUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={currentUser.name || 'Worker'} 
                  className="w-20 h-20 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
                  <span className="text-xs text-slate-500 font-mono block mt-1">{currentUser.phone}</span>
                  <div className="flex justify-center sm:justify-start items-center gap-2 mt-2">
                    <RatingStars rating={currentUser.rating} size={15} />
                    <span className="text-xs text-slate-400 font-medium">({currentUser.ratingCount || 0} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  My Skills
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
                  Employer Feedback ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No reviews received yet. Completed jobs will show feedback here.</p>
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
    </div>
  );
};

export default WorkerDashboard;
