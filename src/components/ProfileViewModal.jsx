import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import RatingStars from './RatingStars';
import { authService, reviewService } from '../services/db';
import { BadgeCheck, MapPin, Briefcase, Star, Clock, AlertCircle } from 'lucide-react';

const ProfileViewModal = ({ isOpen, onClose, targetUserId, currentUserId, currentUserName, canWriteReview }) => {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Submit Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const loadProfileData = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      setError('');
      
      const userProfile = await authService.getCurrentUser(targetUserId);
      if (userProfile) {
        setProfile(userProfile);
        const userReviews = await reviewService.getUserReviews(targetUserId);
        setReviews(userReviews);
      } else {
        setError('User profile not found.');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile details.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadProfileData();
      // Reset form on open
      setRating(5);
      setComment('');
      setSubmitError('');
      setSubmitSuccess('');
    }
  }, [isOpen, targetUserId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    
    if (!comment.trim()) {
      setSubmitError('Please provide a comment for your review.');
      return;
    }

    try {
      setSubmitLoading(true);
      
      // Submit the review
      await reviewService.submitReview(
        currentUserId,
        currentUserName || 'User',
        targetUserId,
        'direct_review', // Used for reviews outside context of a specific active jobId
        profile.role === 'worker' ? 'Hired Worker Review' : 'Employer Partnership Review',
        rating,
        comment
      );
      
      setSubmitSuccess('Review submitted successfully!');
      setComment('');
      setRating(5);
      
      // Reload profile and reviews to update stats in real-time
      const updatedProfile = await authService.getCurrentUser(targetUserId);
      if (updatedProfile) setProfile(updatedProfile);
      
      const userReviews = await reviewService.getUserReviews(targetUserId);
      setReviews(userReviews);
      
      setSubmitLoading(false);
    } catch (err) {
      console.error(err);
      setSubmitError('Failed to submit review. Please try again.');
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={profile ? `${profile.name}'s Profile` : 'User Profile'}>
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : profile ? (
        <div className="flex flex-col gap-6 text-left">
          {/* User Profile Header Card */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-4">
            <img 
              src={profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
              alt={profile.name} 
              className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-slate-800 text-base leading-tight truncate">{profile.name}</h4>
                {profile.verified && (
                  <BadgeCheck size={16} className="fill-green-600 text-white shrink-0" title="Verified Badge" />
                )}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 block">
                {profile.role === 'worker' ? 'Helper / Worker' : `${profile.businessType || 'Household'} Employer`}
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <RatingStars rating={profile.rating || 0} size={13} />
                <span className="text-xs text-slate-400 font-semibold">({profile.ratingCount || 0} reviews)</span>
              </div>
            </div>
          </div>

          {/* User Description / About Me */}
          {profile.description && (
            <div className="bg-slate-50 border border-slate-200/40 p-3.5 rounded-xl text-xs text-slate-650 italic leading-relaxed">
              "{profile.description}"
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              <span>Location: <strong>{profile.location || 'Not Specified'}</strong></span>
            </div>
            
            {profile.role === 'worker' ? (
              <>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Briefcase size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block mb-1.5 font-semibold text-slate-700">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map(s => (
                          <span key={s} className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[10px] font-bold">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 font-medium">None Listed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock size={15} className="text-slate-400 shrink-0" />
                  <span>Availability: <strong>{profile.availability ? '🟢 Available' : '🔴 Busy'}</strong></span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Briefcase size={15} className="text-slate-400 shrink-0" />
                <span>Profile Type: <strong>{profile.businessType || 'Individual'}</strong></span>
              </div>
            )}
          </div>

          {/* Submit Review section */}
          {canWriteReview && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3.5 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Write a Review</h5>
              
              {submitError && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold p-2.5 rounded border border-red-100">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded border border-green-100">
                  {submitSuccess}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase">Rating:</span>
                  <RatingStars rating={rating} size={20} interactive={true} onChange={(v) => setRating(v)} />
                </div>
                <div>
                  <textarea
                    rows={2}
                    placeholder="Describe your experience working together..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center touch-target"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List Section */}
          <div className="border-t border-slate-100 pt-4">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">
              Feedback History ({reviews.length})
            </h5>
            
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No reviews received yet.</p>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-56 overflow-y-auto no-scrollbar">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-850 text-xs">{rev.reviewerName}</span>
                      <RatingStars rating={rev.rating} size={10} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">"{rev.comment}"</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ProfileViewModal;
