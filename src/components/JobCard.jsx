import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, IndianRupee, Users, BadgeCheck, Phone, MessageSquare, Briefcase, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  onViewEmployerProfile
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

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
    status,
    createdAt
  } = job;

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
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            {t('bookedFilled')}
          </span>
        );
      case 'completed':
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
                href={`https://wa.me/${job.employerPhone?.replace(/[^0-9]/g, '')}?text=Hello, I have been selected for the "${title}" job on WorkLink.`}
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
  const cityPart = locationParts[0] ? locationParts[0].trim() : '';
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
    } catch (e) {
      return '';
    }
  };

  const hasActions = (status === 'booked' && onMarkCompleted) || (status === 'open' && onDelete);

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between gap-5 text-left relative">
      <div>
        {/* Main Content Layout with Briefcase Icon on Left */}
        <div className="flex items-start gap-4">
          {/* Briefcase Icon Container */}
          <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0">
            <Briefcase size={22} className="stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: Title and Status Badge */}
            <div className="flex items-center gap-2 flex-wrap text-left">
              <h4 className="font-bold text-slate-800 text-base leading-snug truncate">{title}</h4>
              {getStatusBadge()}
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

            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed break-words">{description}</p>

            <div className={
              userRole === 'employer'
                ? 'grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100 mt-5 pt-4'
                : 'grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-t border-slate-100 mt-5 pt-4'
            }>
              {/* Column 1: Payment */}
              <div className="flex items-start gap-2.5">
                <IndianRupee className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-sm">₹{payment}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">{paymentType === 'per day' ? t('perDayLabel') : t('fixedLabel')}</div>
                </div>
              </div>
              
              {/* Column 2: Location */}
              <div className="flex items-start gap-2.5 border-l border-slate-100 pl-4">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-sm">{cityPart ? `${cityPart},` : ''}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">{areaPart || t('location')}</div>
                </div>
              </div>
              
              {/* Column 3: Time */}
              <div className="flex items-start gap-2.5 border-none pl-0 md:border-l md:border-slate-100 md:pl-4">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-sm truncate max-w-[120px] sm:max-w-none" title={timeMain}>{timeMain}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">{timeSub}</div>
                </div>
              </div>
              
              {/* Column 4: Applicants (Employer Only) */}
              {userRole === 'employer' && (
                <div className="flex items-start gap-2.5 border-l border-slate-100 pl-4 col-span-1">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-slate-800 text-sm">{t('applicants')}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
                      {applicants.length} ({workersSelectedCount} selected / {workersNeeded} needed)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Divider */}
      <hr className="border-slate-100 my-0" />

      {/* Footer and Actions */}
      <div className="flex items-center justify-between gap-4 mt-auto">
        {/* Date Posted */}
        <div className="text-[11px] text-slate-400 font-semibold">
          {t('postedOn', { date: getFormattedDate(createdAt || job.createdAt) })}
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

export default JobCard;

