import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService, applicationService, notificationService, reviewService } from '../services/db';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import JobCard from '../components/JobCard';
import NotificationCard from '../components/NotificationCard';
import Modal from '../components/Modal';
import RatingStars from '../components/RatingStars';
import { Plus, Users, MapPin, BadgeCheck, Phone, MessageSquare, Star, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

const EmployerDashboard = () => {
  const { currentUser, reloadProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [myJobs, setMyJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        setReviewWorkerName(app ? app.workerName : 'Worker');
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
      setReviewError('Please provide a short comment.');
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
        job ? job.title : 'Part-Time Job',
        workerRating,
        workerComment
      );
      setReviewLoading(false);
      setIsReviewOpen(false);
    } catch (err) {
      console.error(err);
      setReviewError('Submission failed. Please try again.');
      setReviewLoading(false);
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job post?")) {
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6 flex flex-col justify-between">
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* TAB 1: Overview Dashboard */}
          {activeTab === 'home' && (
            <div className="flex flex-col gap-6 text-left">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Requirements</span>
                  <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{activeJobs.length}</span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Jobs</span>
                  <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{completedJobs.length}</span>
                </div>
              </div>

              {/* Action Panels */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Need manual helpers?</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">
                    Post AC services, shifting assistance, grocery loading, delivery drops, or event setup. Workers in your neighborhood will apply instantly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/post-job')}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl text-xs shadow-sm transition-all touch-target w-full sm:w-auto text-center"
                >
                  Post a Job Requirement
                </button>
              </div>

              {/* Active list summary */}
              <div>
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">
                  Current Open Posts
                </h3>
                {activeJobs.length === 0 ? (
                  <div className="bg-white border border-slate-200 border-dashed p-8 rounded-xl text-center text-slate-400 text-xs font-semibold">
                    No active postings. Click "Post a Job Requirement" above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeJobs.slice(0, 2).map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        userRole="employer"
                        onViewApplicants={handleOpenApplicants}
                        onMarkCompleted={handleMarkJobCompleted}
                        onDelete={handleDeleteJob}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: My Postings List */}
          {activeTab === 'jobs' && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  All Job Posts ({myJobs.length})
                </h2>
                <button 
                  type="button"
                  onClick={() => navigate('/post-job')}
                  className="bg-primary text-white text-xs font-bold rounded-lg px-3.5 py-2 hover:bg-primary-dark transition-colors touch-target flex items-center gap-1"
                >
                  <Plus size={14} /> Add Post
                </button>
              </div>

              {myJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-12 rounded-xl text-center flex flex-col items-center gap-3">
                  <Plus size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">You haven't posted any jobs yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/post-job')}
                    className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg touch-target"
                  >
                    Create a Job Post
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      userRole="employer"
                      onViewApplicants={handleOpenApplicants}
                      onMarkCompleted={handleMarkJobCompleted}
                      onDelete={handleDeleteJob}
                    />
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
                  Alert Box ({notifications.length})
                </h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-primary hover:underline touch-target"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center flex flex-col items-center gap-3">
                  <Users size={36} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No applicant notifications yet.</p>
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
                  src={currentUser.profilePhotoUrl} 
                  alt={currentUser.name} 
                  className="w-20 h-20 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1.5 block">
                    {currentUser.businessType === 'Business' ? 'Shop Owner' : 'Household Employer'}
                  </span>
                  <div className="flex justify-center sm:justify-start items-center gap-2 mt-2">
                    <RatingStars rating={currentUser.rating} size={15} />
                    <span className="text-xs text-slate-400 font-medium">({currentUser.ratingCount || 0} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  Worker Feedback ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No ratings submitted by workers yet.</p>
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
          className="fixed bottom-20 right-4 z-40 bg-primary hover:bg-primary-dark text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden flex items-center justify-center"
          title="Create Job Requirement"
        >
          <Plus size={24} />
        </button>
      )}

      {/* MODAL 1: APPLICANT LIST MANAGER */}
      <Modal
        isOpen={isApplicantsOpen}
        onClose={() => setIsApplicantsOpen(false)}
        title="Manage Job Applicants"
      >
        {applicantsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-semibold">
            No applications submitted yet for this post.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applicants.map((app) => (
              <div key={app.id} className="border border-slate-150 p-4 rounded-xl flex flex-col gap-3 text-left">
                {/* Details */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{app.workerName}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <RatingStars rating={app.workerRating} size={11} />
                      <span className="text-[10px] text-slate-400">Worker</span>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    app.status === 'selected' 
                      ? 'bg-green-50 text-green-700' 
                      : app.status === 'rejected'
                        ? 'bg-red-50 text-red-700'
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
                        className="flex-1 py-2 text-center bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 touch-target"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectWorker(app.workerId)}
                        className="flex-1 py-2 text-center bg-primary hover:bg-primary-dark text-white font-bold rounded-lg text-xs shadow-sm touch-target"
                      >
                        Select Worker
                      </button>
                    </>
                  ) : app.status === 'selected' ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                        <a 
                          href={`tel:${app.workerPhone}`}
                          className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target"
                        >
                          <Phone size={13} /> Call Worker
                        </a>
                        <a 
                          href={`https://wa.me/${app.workerPhone?.replace(/[^0-9]/g, '')}?text=Hello ${app.workerName}, you have been selected for my job post on WorkLink. Please reply.`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-[#25D366] text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target"
                        >
                          <MessageSquare size={13} /> WhatsApp
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRejectWorker(app.workerId)}
                        className="text-slate-400 hover:text-red-600 text-[10px] text-center font-bold mt-1 block py-1"
                      >
                        Cancel Selection
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectWorker(app.workerId)}
                      className="w-full py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs touch-target"
                    >
                      Deselect & Hire instead
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
        title={`Review Helper - ${reviewWorkerName}`}
      >
        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 text-left">
          {reviewError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100">
              {reviewError}
            </div>
          )}

          <div className="text-center py-2">
            <span className="text-xs text-slate-500 font-bold block mb-2 uppercase">Tap to Rate</span>
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
            <label htmlFor="commentText" className="block text-xs font-bold text-slate-600 mb-1">Your Comment</label>
            <textarea
              id="commentText"
              rows={3}
              placeholder="How was the helper's performance? (e.g. Punctual, hardworking, polite)"
              value={workerComment}
              onChange={(e) => setWorkerComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={reviewLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl text-xs transition-colors touch-target flex justify-center items-center"
          >
            {reviewLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EmployerDashboard;
