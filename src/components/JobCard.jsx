import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, IndianRupee, Users, Phone, MessageSquare, Briefcase, MoreVertical, ChevronDown, ChevronUp, Star, CalendarDays, UserCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService, jobService } from '../services/db';
import JobProgressTracker from './JobProgressTracker';
import { getDistance, formatDistance, getJobUrgentBadge } from '../utils/geo';

// Ghibli-inspired Job WebP Icons
import officeShiftingIcon from '../assets/job-icons/office-shifting.webp';
import houseShiftingIcon from '../assets/job-icons/house-shifting.webp';
import packageLoadingIcon from '../assets/job-icons/package-loading.webp';
import deliveryIcon from '../assets/job-icons/delivery.webp';
import acRepairIcon from '../assets/job-icons/ac-repair.webp';
import electricianIcon from '../assets/job-icons/electrician.webp';
import plumberIcon from '../assets/job-icons/plumber.webp';
import carpenterIcon from '../assets/job-icons/carpenter.webp';
import painterIcon from '../assets/job-icons/painter.webp';
import cleaningIcon from '../assets/job-icons/cleaning.webp';
import deepCleaningIcon from '../assets/job-icons/deep-cleaning.webp';
import laundryIcon from '../assets/job-icons/laundry.webp';
import cookingIcon from '../assets/job-icons/cooking.webp';
import gardenerIcon from '../assets/job-icons/gardener.webp';
import pestControlIcon from '../assets/job-icons/pest-control.webp';
import driverIcon from '../assets/job-icons/driver.webp';
import securityIcon from '../assets/job-icons/security.webp';
import helperIcon from '../assets/job-icons/helper.webp';
import eventStaffIcon from '../assets/job-icons/event-staff.webp';
import elderlyCareIcon from '../assets/job-icons/elderly-care.webp';
import defaultIcon from '../assets/job-icons/default.webp';

const getCategoryIcon = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('office shifting') || text.includes('office moving') || text.includes('office shift')) {
    return officeShiftingIcon;
  }
  if (text.includes('house shifting') || text.includes('house moving') || text.includes('house shift') || text.includes('home shifting') || text.includes('home moving')) {
    return houseShiftingIcon;
  }
  if (text.includes('package loading') || text.includes('loading') || text.includes('unloading') || text.includes('parcel loading') || text.includes('package load')) {
    return packageLoadingIcon;
  }
  if (text.includes('delivery') || text.includes('deliver') || text.includes('rider') || text.includes('courier')) {
    return deliveryIcon;
  }
  if (text.includes('ac repair') || text.includes('ac service') || text.includes('air conditioner') || text.includes('ac technician')) {
    return acRepairIcon;
  }
  if (text.includes('electrician') || text.includes('electrical') || text.includes('wiring') || text.includes('switchboard') || text.includes('power repair')) {
    return electricianIcon;
  }
  if (text.includes('plumber') || text.includes('plumbing') || text.includes('leak') || text.includes('tap repair') || text.includes('sink repair') || text.includes('pipe repair')) {
    return plumberIcon;
  }
  if (text.includes('carpenter') || text.includes('carpentry') || text.includes('furniture') || text.includes('wooden') || text.includes('wood work')) {
    return carpenterIcon;
  }
  if (text.includes('painter') || text.includes('painting') || text.includes('paint') || text.includes('wall paint')) {
    return painterIcon;
  }
  if (text.includes('deep cleaning') || text.includes('vacuum') || text.includes('sofa cleaning')) {
    return deepCleaningIcon;
  }
  if (text.includes('cleaning') || text.includes('cleaner') || text.includes('clean') || text.includes('wash') || text.includes('sweeping') || text.includes('mopping')) {
    return cleaningIcon;
  }
  if (text.includes('gardening') || text.includes('gardener') || text.includes('plant') || text.includes('lawn') || text.includes('weeding')) {
    return gardenerIcon;
  }
  if (text.includes('driver') || text.includes('driving') || text.includes('car driver') || text.includes('chauffeur')) {
    return driverIcon;
  }
  if (text.includes('security') || text.includes('watchman') || text.includes('guard') || text.includes('security guard')) {
    return securityIcon;
  }
  if (text.includes('elderly care') || text.includes('caregiver') || text.includes('patient care') || text.includes('elder care') || text.includes('nanny') || text.includes('baby sitting')) {
    return elderlyCareIcon;
  }
  if (text.includes('laundry') || text.includes('ironing') || text.includes('washing clothes') || text.includes('clothes')) {
    return laundryIcon;
  }
  if (text.includes('pest control') || text.includes('pest') || text.includes('insect') || text.includes('termite') || text.includes('spray')) {
    return pestControlIcon;
  }
  if (text.includes('event staff') || text.includes('event') || text.includes('catering') || text.includes('volunteers')) {
    return eventStaffIcon;
  }
  if (text.includes('cooking') || text.includes('cook') || text.includes('chef') || text.includes('prepare food') || text.includes('meal')) {
    return cookingIcon;
  }
  if (text.includes('helper') || text.includes('general') || text.includes('assistant') || text.includes('labor') || text.includes('worker')) {
    return helperIcon;
  }
  
  return defaultIcon;
};

const JobCard = ({
  job,
  userRole,
  isApplied,
  applicationStatus,
  isUserVerified,
  onApply,
  onViewApplicants,
  onConfirmCompletion,
  onDelete,
  onViewEmployerProfile,
  hideProgress,
  workerCoords
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const distance = (workerCoords && job.latitude !== undefined && job.longitude !== undefined)
    ? getDistance(workerCoords.lat, workerCoords.lng, job.latitude, job.longitude)
    : null;
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
          const profile = await authService.getCurrentUser(targetWorkerId);
          setWorkerProfile(profile);
        } catch (e) {
          console.error('Error fetching worker profile:', e);
        }
      }
    };
    fetchWorkerProfile();
  }, [status, userRole, targetWorkerId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // ── Status helpers ──────────────────────────────────────────────────────────
  const getStatusLabel = () => {
    switch (status) {
      case 'open': return { label: `Open · ${workersNeeded - workersSelectedCount} needed`, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'booked':
      case 'ACCEPTED': return { label: 'Accepted', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'WORK_STARTED': return { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'WORK_COMPLETED': return { label: 'Awaiting Confirmation', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
      case 'completed':
      case 'COMPLETED': return { label: t('completed'), color: 'text-green-700 bg-green-50 border-green-200' };
      default: return null;
    }
  };

  const getAppStatusLabel = () => {
    switch (applicationStatus) {
      case 'pending': return { label: t('applicationPending'), color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'selected': return { label: t('selectedForJob'), color: 'text-green-700 bg-green-50 border-green-200' };
      case 'rejected': return { label: t('notSelected'), color: 'text-red-700 bg-red-50 border-red-200' };
      default: return null;
    }
  };

  // ── Date/time display ───────────────────────────────────────────────────────
  const jobDateDisplay = job.jobDate
    ? new Date(job.jobDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : getFormattedDate(createdAt);

  const timeDisplay = (job.startTime && job.endTime)
    ? `${job.startTime} – ${job.endTime}`
    : workingHours || '';

  function getFormattedDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const locationParts = location ? location.split(',') : ['', ''];
  const areaPart = locationParts[1] ? locationParts[1].trim() : '';
  const displayLocation = (job.locality && job.city)
    ? `${job.locality}, ${job.city}`
    : location || '';

  const statusInfo = getStatusLabel();
  const appStatusInfo = userRole === 'worker' ? getAppStatusLabel() : null;

  // Which status to show in bottom-left
  const bottomStatus = userRole === 'worker' ? (appStatusInfo || statusInfo) : statusInfo;

  // Show rate star: worker sees it when completed, employer sees it when completed
  const isCompleted = status === 'completed' || status === 'COMPLETED';
  const showRateForWorker = userRole === 'worker' && isCompleted && onViewEmployerProfile;
  const showRateForEmployer = userRole === 'employer' && isCompleted && onViewApplicants;

  const hasActions = status === 'open' && onDelete;

  // ── Shared card skeleton ────────────────────────────────────────────────────
  return (
    <div
      id={`job-${job.id}`}
      className={`bg-white border rounded-2xl shadow-sm text-left flex flex-col gap-0 overflow-hidden ${
        status === 'completed' || status === 'COMPLETED'
          ? 'border-green-200'
          : 'border-slate-200'
      }`}
    >
      {/* ── TOP SECTION ─────────────────────────────────────────────────── */}
      <div className="p-4 flex items-start justify-between gap-3">

        {/* LEFT: icon + title + date/time */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Illustration Icon */}
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 mt-0.5 border border-slate-100 flex items-center justify-center bg-slate-50 shadow-sm">
            <img
              src={getCategoryIcon(title, description)}
              alt={title || 'Job category illustration'}
              className="w-full h-full object-cover"
              loading="lazy"
              width="48"
              height="48"
            />
          </div>
          {/* Title + date/time */}
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-800 text-[17px] leading-snug line-clamp-2">
              {title}
            </h4>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {jobDateDisplay && (
                <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-500">
                  <CalendarDays size={12} className="text-slate-400 shrink-0" />
                  {jobDateDisplay}
                </span>
              )}
              {timeDisplay && (
                <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-500">
                  <Clock size={12} className="text-slate-400 shrink-0" />
                  {timeDisplay}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: amount + expand arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-0.5 justify-end">
              <IndianRupee size={16} className="text-green-600 stroke-[2.5] shrink-0" />
              <span className="text-[20px] font-extrabold text-green-700 leading-none">{payment}</span>
            </div>
            {paymentType && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-right mt-0.5">
                {paymentType}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 cursor-pointer shrink-0 focus:outline-none touch-target"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ── MIDDLE SECTION: location + posted by ────────────────────────── */}
      <div className="px-4 pb-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
        {/* Location row */}
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-primary shrink-0" />
          <span className="text-[13px] font-bold text-slate-700 truncate">
            {job.locality || areaPart || t('location')}
            {(job.city && job.city !== job.locality) && (
              <span className="font-semibold text-slate-500">, {job.city}</span>
            )}
          </span>
          {distance !== null && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0 ml-auto">
              {formattedDistance}
            </span>
          )}
        </div>

        {/* Posted by row */}
        {job.employerName && (
          <div className="flex items-center gap-2">
            <UserCircle2 size={14} className="text-slate-400 shrink-0" />
            <span className="text-[12px] font-semibold text-slate-500">{t('postedBy')}:</span>
            <button
              type="button"
              onClick={() => onViewEmployerProfile && onViewEmployerProfile(job.employerId)}
              className="text-[12px] font-bold text-primary cursor-pointer focus:outline-none truncate"
            >
              {job.employerName}
            </button>
          </div>
        )}

        {/* Urgent / nearby badges */}
        {(urgentBadge) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {urgentBadge && (
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                urgentBadge.type === 'starts_soon'
                  ? 'bg-red-50 text-red-750 border-red-200'
                  : urgentBadge.type === 'immediate'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                <span>{t(urgentBadge.type === 'starts_soon' ? 'startsSoon' : urgentBadge.type === 'immediate' ? 'immediateHiring' : 'urgent')}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── EXPANDED DETAILS ─────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
          {/* Description */}
          {description && (
            <p className="text-slate-600 text-[13px] leading-relaxed break-words bg-slate-50 border border-slate-100 p-3 rounded-xl selectable-text">
              {description}
            </p>
          )}

          {/* Working hours detail */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Clock size={14} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Working Hours</span>
              <strong className="text-slate-800 text-[13px] font-bold">{workingHours}</strong>
            </div>
          </div>

          {/* Location detail */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
            <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Work Location</span>
              <strong className="text-slate-800 text-[13px] block">{job.locality || areaPart}, {job.city}</strong>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{job.formattedAddress || displayLocation}</span>
            </div>
          </div>

          {/* Posted on */}
          <div className="text-[11px] text-slate-400 font-bold">
            {t('postedOn', { date: getFormattedDate(createdAt || job.createdAt) })}
          </div>

          {/* Employer-only: applicants info */}
          {userRole === 'employer' && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <Users size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Applicants</span>
                <strong className="text-slate-800 text-[13px] font-bold">{applicants.length} applied · {workersSelectedCount}/{workersNeeded} hired</strong>
              </div>
            </div>
          )}

          {/* Progress tracker */}
          {status !== 'open' && !hideProgress && (
            <div className="pt-1">
              <JobProgressTracker status={status} />
            </div>
          )}

          {/* Work completion confirmation (employer) */}
          {status === 'WORK_COMPLETED' && userRole === 'employer' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <p className="text-[13px] font-bold text-emerald-800">
                Worker has marked the tasks as completed. Please verify and confirm.
              </p>
              <button
                type="button"
                onClick={() => onConfirmCompletion && onConfirmCompletion(job.id)}
                className="w-full bg-green-650 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm cursor-pointer touch-target"
              >
                Confirm Job Completion
              </button>
            </div>
          )}

          {/* Worker: Mark Work Completed button */}
          {userRole === 'worker' && applicationStatus === 'selected' && (jobService.getEffectiveJobStatus(job) === 'In Progress' || status === 'WORK_STARTED') && (
            <button
              type="button"
              onClick={() => onConfirmCompletion && onConfirmCompletion(job.id)}
              className="w-full bg-green-650 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm cursor-pointer touch-target mb-3"
            >
              Mark Work Completed
            </button>
          )}

          {/* Worker: contact buttons when selected */}
          {userRole === 'worker' && applicationStatus === 'selected' && (
            <div className="flex gap-2">
              <a
                href={`tel:${job.employerPhone}`}
                className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 touch-target"
              >
                <Phone size={14} />
                {t('callEmployer')}
              </a>
              <a
                href={`https://wa.me/${job.employerPhone?.replace(/[^0-9]/g, '')}?text=Hello, I have been selected for the "${title}" job on Jobink.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center bg-[#25D366] text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 touch-target"
              >
                <MessageSquare size={14} />
                {t('whatsapp')}
              </a>
            </div>
          )}

          {/* Worker: apply button */}
          {userRole === 'worker' && !isApplied && status === 'open' && (
            isUserVerified ? (
              <button
                type="button"
                onClick={() => onApply && onApply(job.id)}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-sm cursor-pointer touch-target"
              >
                {t('applyNow')}
              </button>
            ) : (
              <div className="text-center text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl">
                {t('verificationRequiredToApply')}
              </div>
            )
          )}

          {/* Employer: view applicants */}
          {userRole === 'employer' && onViewApplicants && (
            <button
              type="button"
              onClick={() => onViewApplicants(job.id)}
              className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer touch-target"
            >
              <Users size={14} />
              {t('viewApplicantsCount', { count: applicants.length })}
            </button>
          )}

          {/* Employer: delete option */}
          {hasActions && (
            <button
              type="button"
              onClick={() => onDelete && onDelete(job.id)}
              className="w-full py-2.5 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl text-sm cursor-pointer touch-target"
            >
              {t('delete')}
            </button>
          )}
        </div>
      )}

      {/* ── BOTTOM BAR: status + rate star ──────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60 rounded-b-2xl">
        {/* Bottom-left: status pill */}
        <div>
          {bottomStatus ? (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${bottomStatus.color}`}>
              {bottomStatus.label}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">—</span>
          )}
        </div>

        {/* Bottom-right: rate star or quick apply */}
        <div className="flex items-center gap-2">
          {showRateForWorker && (
            <button
              type="button"
              onClick={() => onViewEmployerProfile && onViewEmployerProfile(job.employerId)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded-xl cursor-pointer touch-target shadow-sm"
              title="Rate Employer"
            >
              <Star size={14} className="fill-white text-white" />
              Rate Employer
            </button>
          )}

          {showRateForEmployer && (
            <button
              type="button"
              onClick={() => onViewApplicants && onViewApplicants(job.id)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded-xl cursor-pointer touch-target shadow-sm"
              title="Rate Worker"
            >
              <Star size={14} className="fill-white text-white" />
              Rate Worker
            </button>
          )}

          {/* Worker: compact apply if not applied and not expanded */}
          {userRole === 'worker' && !isApplied && !isExpanded && status === 'open' && isUserVerified && (
            <button
              type="button"
              onClick={() => onApply && onApply(job.id)}
              className="text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded-xl cursor-pointer touch-target"
            >
              {t('applyNow')}
            </button>
          )}

          {/* Employer: compact view applicants if not expanded */}
          {userRole === 'employer' && !isExpanded && onViewApplicants && !isCompleted && (
            <button
              type="button"
              onClick={() => onViewApplicants(job.id)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded-xl cursor-pointer touch-target"
            >
              <Users size={12} />
              {applicants.length}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(JobCard);
