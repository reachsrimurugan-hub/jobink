import React from'react';
import { Check, Clipboard, UserCheck, Flame, CheckCircle, Trophy } from'lucide-react';

const STEPS = [
 { label:'Open', statusKey:'open', icon: Clipboard },
 { label:'Accepted', statusKey:'ACCEPTED', icon: UserCheck },
 { label:'In Progress', statusKey:'WORK_STARTED', icon: Flame },
 { label:'Awaiting Confirmation', statusKey:'WORK_COMPLETED', icon: CheckCircle },
 { label:'Completed', statusKey:'COMPLETED', icon: Trophy }
];

const JobProgressTracker = ({ status }) => {
 // Determine current active step index
 const getCurrentStepIndex = () => {
 switch (status) {
 case'open':
 return 0;
 case'ACCEPTED':
 case'booked':
 case'Scheduled':
 return 1;
 case'WORK_STARTED':
 case'In Progress':
 return 2;
 case'WORK_COMPLETED':
 case'AWAITING_EMPLOYER_CONFIRMATION':
 case'Awaiting Employer Confirmation':
 return 3;
 case'COMPLETED':
 case'completed':
 case'Completed':
 return 4;
 default:
 return 0;
 }
 };

 const currentStep = getCurrentStepIndex();

 return (
 <div className="w-full py-4 text-left">
 {/* Title */}
 <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Job Progress</span>
 
 {/* Stepper Container */}
 <div className="relative flex items-center justify-between w-full">
 {/* Background Line */}
 <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0 rounded-full" />
 
 {/* Colored Progress Line */}
 <div 
 className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 z-0 rounded-full ease-out bg-primary"
 style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
 />

 {/* Steps */}
 {STEPS.map((step, idx) => {
 const StepIcon = step.icon;
 const isCompleted = idx < currentStep;
 const isActive = idx === currentStep;
 const isUpcoming = idx > currentStep;
 
 let circleBg ='bg-white border-slate-200 text-slate-400';
 let textColor ='text-slate-450';
 
 if (isCompleted) {
 circleBg ='bg-primary border-primary text-white shadow-sm shadow-primary/20';
 textColor ='text-slate-600 font-semibold';
 } else if (isActive) {
 circleBg ='bg-white border-primary text-primary ring-4 ring-primary/10 shadow-md shadow-primary/10';
 textColor ='text-primary font-bold';
 } else if (isUpcoming) {
 circleBg ='bg-white border-slate-200 text-slate-355';
 textColor ='text-slate-400';
 }

 return (
 <div key={step.label} className="relative flex flex-col items-center z-10 flex-1">
 {/* Circle Bubble */}
 <div 
 className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${circleBg}`}
 title={step.label}
 >
 {isCompleted ? (
 <Check size={14} className="stroke-[3]" />
 ) : (
 <StepIcon size={14} className="stroke-[2.5]" />
 )}
 </div>

 {/* Text label - Visible on desktop, hidden on extra small mobile screen */}
 <span className={`text-[9px] mt-1.5 text-center hidden sm:block truncate max-w-[80px] ${textColor}`}>
 {step.label}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 );
};

export default JobProgressTracker;
