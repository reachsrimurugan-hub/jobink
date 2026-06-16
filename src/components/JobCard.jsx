import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, IndianRupee, Users, Phone, MessageSquare, Briefcase, MoreVertical, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/db';
import JobProgressTracker from './JobProgressTracker';
import { getDistance, formatDistance, getJobUrgentBadge } from '../utils/geo';

const JobCard = ({ 
  job, 
  userRole, 
  isApplied, 
  applicationStatus, 
  isUserVerified,
  onApply, 
  onViewApplicants, 
  onMarkCompleted,
  onDelete,
  onViewEmployerProfile,
  onMarkPaid,
  onRespondToDispute,
  hideProgress,
  workerCoords
}) => {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');
  const labelClass = isTamil ? 'text-[8px] tracking-normal' : 'text-[9px] tracking-wider';
  const valueClass = isTamil ? 'text-xs' : 'text-[13px]';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const distance = (workerCoords && job.latitude !== undefined && job.longitude !== undefined)
    ? getDistance(workerCoords.lat, workerCoords.lng, job.latitude, job.longitude)
    : null;
  const isNearby = distance !== null && distance <= 2;
  const formattedDistance = formatDistance(distance, t);
  const urgentBadge = getJobUrgentBadge(job);

  const { 
    title, 
    description, 
    payment, 
    paymentType, 
    location, 
    workingHours, 
    workersNeeded, 
    workersSelectedCount = 0,
    applicants = [],
    selectedWorkers = [],
    status,
    createdAt
  } = job;

  const [workerProfile, setWorkerProfile] = useState(null);
  const [loadingWorker, setLoadingWorker] = useState(false);
  const targetWorkerId = job.workerId || (selectedWorkers && selectedWorkers[0]);

  useEffect(() => {
    const fetchWorkerProfile = async () => {
      if (
        (status === 'WORK_COMPLETED' || 
         status === 'EMPLOYER_MARKED_PAID' || 
         status === 'DISPUTED' || 
         status === 'COMPLETED' || 
         status === 'completed') && 
        userRole === 'employer' && 
        targetWorkerId
      ) {
        try {
          setLoadingWorker(true);
          const profile = await authService.getCurrentUser(targetWorkerId);
          setWorkerProfile(profile);
          setLoadingWorker(false);
        } catch (e) {
          console.error("Error fetching worker profile for payment:", e);
          setLoadingWorker(false);
        }
      }
    };
    fetchWorkerProfile();
  }, [status, userRole, targetWorkerId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Helpers for status formatting
  const getStatusBadge = () => {
    switch (status) {
      case 'open':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            {t('openJobsNeeded', { count: workersNeeded - workersSelectedCount })}
          </span>
        );
      case 'booked':
      case 'ACCEPTED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            Accepted
          </span>
        );
      case 'WORK_STARTED':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            Work Started
          </span>
        );
      case 'WORK_COMPLETED':
        return (
          <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            Work Completed
          </span>
        );
      case 'EMPLOYER_MARKED_PAID':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            Employer Paid
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldAlert size={10} /> Disputed
          </span>
        );
      case 'completed':
      case 'COMPLETED':
        return (
          <span className="bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            {t('completed')}
          </span>
        );
      default:
        return null;
    }
  };

  const getApplicationStatusBadge = () => {
    switch (applicationStatus) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-1.5 rounded-xl w-full text-center block">{t('applicationPending')}</span>;
      case 'selected':
        return (
          <div className="flex flex-col gap-2 w-full">
            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2 py-1.5 rounded-xl w-full text-center block">{t('selectedForJob')}</span>
            {/* Contact buttons */}
            <div className="flex gap-2 w-full">
              <a 
                href={`tel:${job.employerPhone}`} 
                className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 touch-target"
              >
                <Phone size={14} />
                {t('callEmployer')}
              </a>
              <a 
                href={`https://wa.me/${job.employerPhone?.replace(/[^0-9]/g, '')}?text=Hello, I have been selected for the "${title}" job on Jobink.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center bg-[#25D366] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 touch-target"
              >
                <MessageSquare size={14} />
                {t('whatsapp')}
              </a>
            </div>
          </div>
        );
      case 'rejected':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-2 py-1.5 rounded-xl w-full text-center block">{t('notSelected')}</span>;
      default:
        return null;
    }
  };

  // Split location by comma
  const locationParts = location ? location.split(',') : ['', ''];
  const areaPart = locationParts[1] ? locationParts[1].trim() : '';

  // Split working hours by comma to extract duration sub-text
  const timeParts = workingHours ? workingHours.split(',') : ['', ''];
  const timeMain = timeParts[0] ? timeParts[0].trim() : workingHours;
  const timeSub = timeParts[1] ? timeParts[1].trim() : t('duration');

  // Format posted date
  const getFormattedDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const hasActions = (status === 'booked' && onMarkCompleted) || (status === 'open' && onDelete);

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-250 flex flex-col justify-between gap-5 text-left relative ${
      isNearby 
        ? 'border-emerald-250 bg-emerald-50/10 hover:border-emerald-350 shadow-emerald-50/20' 
        : 'bg-white border-slate-150'
    }`}>
      {/* Expand/Collapse arrow near top right corner */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center h-9 w-9 shrink-0 focus:outline-none touch-target"
        title={isExpanded ? 'Show Less' : 'Show Full Details'}
        aria-label={isExpanded ? 'Show Less' : 'Show Full Details'}
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <div>
        {/* Main Content Layout with Briefcase Icon on Left */}
        <div className="flex items-start gap-2.5">
          {/* Briefcase Icon Container */}
          <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase size={16} className="stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: Title and Badges */}
            <div className="flex items-center gap-2 flex-wrap text-left pr-10">
              <h4 className="font-bold text-slate-800 text-base leading-snug truncate pr-2">{title}</h4>
              {isNearby && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <MapPin size={10} className="stroke-[2.5]" />
                  {t('nearbyHighlight')}
                </span>
              )}
              {urgentBadge && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${
                  urgentBadge.type === 'starts_soon' 
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                    : urgentBadge.type === 'immediate' 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  <span>{urgentBadge.emoji}</span>
                  <span>{t(urgentBadge.type === 'starts_soon' ? 'startsSoon' : urgentBadge.type === 'immediate' ? 'immediateHiring' : 'urgent')}</span>
                </span>
              )}
            </div>

            {/* Posted date/time below title */}
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {t('postedOn', { date: getFormattedDate(createdAt || job.createdAt) })}
            </div>

            {/* Employer details for worker */}
            {userRole === 'worker' && job.employerName && (
              <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                <span>{t('postedBy')}:</span>
                <button
                  type="button"
                  onClick={() => onViewEmployerProfile && onViewEmployerProfile(job.employerId)}
                  className="font-bold text-primary hover:underline hover:text-primary-dark cursor-pointer text-left focus:outline-none"
                >
                  {job.employerName}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Default Visible Details: Location, Duration, and Applicants — left-aligned, full-width */}
        <div className="flex flex-col gap-3 border-t border-slate-100 mt-4 pt-4">
          {/* Location with description beneath */}
          <div className="flex items-start gap-2.5 w-full">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className={`text-slate-400 font-bold uppercase leading-none mb-1 ${labelClass}`}>{areaPart || t('location')}</div>
              <div className={`font-bold text-slate-800 leading-normal flex flex-wrap items-center gap-1.5 ${valueClass}`} title={location}>
                <span>{location}</span>
                {distance !== null && (
                  <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                    {formattedDistance}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed break-words">{description}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2.5 w-full">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className={`text-slate-400 font-bold uppercase leading-none mb-1 ${labelClass}`}>{timeSub}</div>
              <div className={`font-bold text-slate-800 truncate leading-none ${valueClass}`} title={timeMain}>{timeMain}</div>
            </div>
          </div>

          {/* Applicants (Employer Only) */}
          {userRole === 'employer' && (
            <div className="flex items-center gap-2.5 w-full">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className={`text-slate-400 font-bold uppercase leading-none mb-1 ${labelClass}`}>{t('applicants')}</div>
                <div className={`font-bold text-slate-800 leading-normal ${valueClass}`}>
                  {applicants.length} ({workersSelectedCount}/{workersNeeded} selected)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Details: Revealed when isExpanded is true */}
        {isExpanded && (
          <div className="space-y-4 border-t border-slate-100 pt-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Payment Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
                    {paymentType === 'per day' ? t('perDayLabel') : t('fixedLabel')}
                  </span>
                  <strong className="text-slate-850 text-lg leading-tight">₹{payment}</strong>
                </div>
              </div>

              {/* Payment status badge for worker */}
              {userRole === 'worker' && (
                <div className="text-right">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Payment Status</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${
                    status === 'COMPLETED' || status === 'completed'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : status === 'EMPLOYER_MARKED_PAID'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : status === 'DISPUTED'
                          ? 'bg-red-50 text-red-700 border-red-250'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {status === 'COMPLETED' || status === 'completed'
                      ? 'Paid & Verified'
                      : status === 'EMPLOYER_MARKED_PAID'
                        ? 'Awaiting Worker Verify'
                        : status === 'DISPUTED'
                          ? 'Payment Disputed'
                          : 'Pending Payment'}
                  </span>
                </div>
              )}
            </div>

            {/* Job progress tracker */}
            {status !== 'open' && !hideProgress && (
              <div className="pt-1">
                <JobProgressTracker status={status} />
              </div>
            )}

            {/* Dispute section */}
            {status === 'DISPUTED' && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2 text-left">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert size={14} className="text-red-650" />
                  <span>Dispute Status: Under Admin Review</span>
                </div>
                {job.paymentAmount && (
                  <p className="text-[11px] font-semibold text-slate-655">
                    Disputed Amount: <strong>₹{job.paymentAmount}</strong>
                  </p>
                )}
                {userRole === 'employer' && onRespondToDispute && (
                  <button
                    type="button"
                    onClick={() => onRespondToDispute(job.id)}
                    className="mt-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3.5 rounded-xl text-[10px] uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    Respond to Dispute
                  </button>
                )}
              </div>
            )}

            {/* Direct UPI Payment Section (Employer side) */}
            {(status === 'WORK_COMPLETED' || status === 'EMPLOYER_MARKED_PAID' || status === 'DISPUTED' || status === 'COMPLETED' || status === 'completed') && userRole === 'employer' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3.5 shadow-sm text-left">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Direct UPI Payment</span>
                  {status === 'COMPLETED' || status === 'completed' ? (
                    <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      Paid & Verified
                    </span>
                  ) : status === 'EMPLOYER_MARKED_PAID' ? (
                    <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      Awaiting Worker Verify
                    </span>
                  ) : status === 'DISPUTED' ? (
                    <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      Payment Disputed
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      Pending Payment
                    </span>
                  )}
                </div>

                {loadingWorker ? (
                  <div className="text-slate-400 animate-pulse text-xs font-semibold py-2">Loading worker details...</div>
                ) : workerProfile ? (
                  (() => {
                    const cleanPhone = workerProfile.phone ? workerProfile.phone.replace(/[^0-9]/g, '').slice(-10) : '';
                    
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 border-b border-slate-200/50 pb-3">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Worker</span>
                            <span className="font-bold text-slate-800 text-[13px]">{workerProfile.name}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-slate-800 text-[11px] break-all">{workerProfile.phone || 'Not Registered'}</span>
                              {workerProfile.phone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cleanPhone);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="text-[9px] font-extrabold text-primary hover:text-primary-dark transition-colors focus:outline-none flex items-center gap-0.5 bg-primary/5 hover:bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer"
                                  title="Copy 10-digit number"
                                >
                                  {copied ? 'Copied!' : 'Copy'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* UPI Details Row */}
                        <div className="border-b border-slate-200/50 pb-3">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Worker UPI ID</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
                                {workerProfile.upiId || 'Not Provided'}
                              </span>
                              {workerProfile.upiId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(workerProfile.upiId);
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

                        {/* Payment Info Display if already paid/marked paid */}
                        {(status === 'EMPLOYER_MARKED_PAID' || status === 'DISPUTED' || status === 'COMPLETED' || status === 'completed') && job.paymentAmount && (
                          <div className="grid grid-cols-2 gap-3 border-b border-slate-200/50 pb-3 text-[11px]">
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Amount Paid</span>
                              <span className="font-extrabold text-slate-800">₹{job.paymentAmount}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Payment Status</span>
                              <span className="font-bold text-slate-800 uppercase text-[10px]">
                                {status === 'COMPLETED' || status === 'completed' ? 'Verified' : 'Awaiting worker confirm'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Expected Job Amount</span>
                            <span className="font-extrabold text-slate-900 text-sm">₹{payment}</span>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {status === 'WORK_COMPLETED' ? (
                              <button
                                type="button"
                                onClick={() => onMarkPaid && onMarkPaid(job.id, targetWorkerId, title)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition-colors touch-target cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            ) : (
                              <button
                                disabled
                                className="bg-slate-100 text-slate-400 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs cursor-not-allowed"
                              >
                                {status === 'EMPLOYER_MARKED_PAID' ? 'Awaiting Confirm' : status === 'DISPUTED' ? 'Disputed' : 'Paid'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-red-500 font-bold py-2">Worker details not found.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Divider */}
      <hr className="border-slate-100 my-0" />

      {/* Footer: Status badge on bottom-left, Action buttons on right */}
      <div className="flex items-center justify-between gap-4 mt-auto">
        {/* Status Badge — bottom left */}
        <div className="shrink-0">
          {getStatusBadge()}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {userRole === 'worker' ? (
            // Worker Actions
            isApplied ? (
              getApplicationStatusBadge()
            ) : status !== 'open' ? (
              <button 
                disabled 
                className="py-2 px-4 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed"
              >
                {t('jobFilledClosed')}
              </button>
            ) : !isUserVerified ? (
              <button 
                disabled 
                className="py-2 px-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold cursor-not-allowed"
                title={t('verificationRequiredToApply')}
              >
                {t('verificationRequiredToApply')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onApply && onApply(job.id)}
                className="py-2 px-5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                {t('applyNow')}
              </button>
            )
          ) : (
            // Employer Actions
            <div className="flex items-center gap-2 relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => onViewApplicants && onViewApplicants(job.id)}
                className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                <Users size={14} />
                <span>{t('viewApplicantsCount', { count: applicants.length })}</span>
              </button>

              {/* Three dots action dropdown menu */}
              {hasActions && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center h-9 w-9 shrink-0"
                    title={t('more')}
                    aria-label={t('more') || 'More options'}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 bottom-11 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[150px] animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {status === 'booked' && onMarkCompleted && (
                        <button
                          type="button"
                          onClick={() => {
                            onMarkCompleted(job.id);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {t('markCompleted')}
                        </button>
                      )}
                      {status === 'open' && onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(job.id);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(JobCard);
