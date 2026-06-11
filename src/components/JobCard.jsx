import React from 'react';
import { MapPin, Clock, IndianRupee, Users, BadgeCheck, Phone, MessageSquare } from 'lucide-react';

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
    status 
  } = job;

  // Helpers for status formatting
  const getStatusBadge = () => {
    switch (status) {
      case 'open':
        return <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded">Open ({workersNeeded - workersSelectedCount} needed)</span>;
      case 'booked':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded">Booked (Filled)</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold px-2 py-0.5 rounded">Completed</span>;
      default:
        return null;
    }
  };

  const getApplicationStatusBadge = () => {
    switch (applicationStatus) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-1 rounded w-full text-center block">Application Pending</span>;
      case 'selected':
        return (
          <div className="flex flex-col gap-2 w-full">
            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2 py-1 rounded w-full text-center block">✓ Selected for Job!</span>
            {/* Contact buttons */}
            <div className="flex gap-2 w-full">
              <a 
                href={`tel:${job.employerPhone}`} 
                className="flex-1 text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target"
              >
                <Phone size={14} />
                Call Employer
              </a>
              <a 
                href={`https://wa.me/${job.employerPhone?.replace(/[^0-9]/g, '')}?text=Hello, I have been selected for the "${title}" job on WorkLink.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center bg-[#25D366] text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 touch-target"
              >
                <MessageSquare size={14} />
                WhatsApp
              </a>
            </div>
          </div>
        );
      case 'rejected':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-2 py-1 rounded w-full text-center block">Not Selected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col justify-between gap-4 text-left">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-slate-800 text-base leading-snug">{title}</h4>
          {getStatusBadge()}
        </div>

        {/* Employer details for worker */}
        {userRole === 'worker' && job.employerName && (
          <div className="text-[11px] text-slate-500 mb-2.5 font-medium flex items-center gap-1">
            <span>Posted by:</span>
            <button
              type="button"
              onClick={() => onViewEmployerProfile && onViewEmployerProfile(job.employerId)}
              className="font-bold text-primary hover:underline hover:text-primary-dark cursor-pointer text-left focus:outline-none"
            >
              {job.employerName}
            </button>
          </div>
        )}

        {/* Description */}
        <p className="text-slate-600 text-xs line-clamp-3 mb-4 leading-relaxed">{description}</p>

        {/* Meta details */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-slate-600 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1.5">
            <IndianRupee size={15} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">₹{payment} <span className="text-[10px] font-normal text-slate-500">{paymentType === 'per day' ? '/ day' : 'fixed'}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="text-slate-400 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Clock size={15} className="text-slate-400 shrink-0" />
            <span className="truncate">{workingHours}</span>
          </div>
          {userRole === 'employer' && (
            <div className="flex items-center gap-1.5 col-span-2 text-slate-500">
              <Users size={15} className="text-slate-400 shrink-0" />
              <span>Applicants: <strong className="text-slate-700">{applicants.length}</strong> ({workersSelectedCount} selected / {workersNeeded} needed)</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 pt-3 mt-auto">
        {userRole === 'worker' ? (
          // Worker Actions
          isApplied ? (
            getApplicationStatusBadge()
          ) : status !== 'open' ? (
            <button 
              disabled 
              className="w-full py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold cursor-not-allowed"
            >
              Job Filled / Closed
            </button>
          ) : !isUserVerified ? (
            <button 
              disabled 
              className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold cursor-not-allowed"
              title="Aadhaar upload and verification required"
            >
              Verification Required to Apply
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApply && onApply(job.id)}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg text-xs shadow-sm transition-all touch-target"
            >
              Apply Now
            </button>
          )
        ) : (
          // Employer Actions
          <div className="flex flex-col gap-2 w-full">
            {status === 'booked' && (
              <button
                type="button"
                onClick={() => onMarkCompleted && onMarkCompleted(job.id)}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all touch-target"
              >
                Mark Completed
              </button>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onViewApplicants && onViewApplicants(job.id)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all touch-target"
              >
                View Applicants ({applicants.length})
              </button>
              
              {status === 'open' && (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(job.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold rounded-lg text-xs transition-all touch-target flex items-center justify-center"
                  title="Delete Job"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;
