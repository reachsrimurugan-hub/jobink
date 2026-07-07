import { useState, useEffect, useCallback } from'react';
import { useNavigate } from'react-router-dom';
import { useAuth } from'../contexts/AuthContext';
import { jobService, applicationService } from'../services/db';
import Navbar from'../components/Navbar';
import { ChevronLeft, Calendar, Clock, User, CheckCircle2, MapPin, AlertCircle } from'lucide-react';

const SchedulePage = () => {
 const navigate = useNavigate();
 const { currentUser } = useAuth();
 
 const [acceptedJobs, setAcceptedJobs] = useState([]);
 const [loading, setLoading] = useState(false);
 const [filter, setFilter] = useState('today'); // today, tomorrow, upcoming, completed
 const [errorMsg, setErrorMsg] = useState('');
 const [successMsg, setSuccessMsg] = useState('');

 const loadSchedule = useCallback(async () => {
 if (!currentUser) return;
 setLoading(true);
 try {
 // Fetch all applications submitted by worker
 const apps = await applicationService.getWorkerApplications(currentUser.uid);
 // Filter for accepted applications
 const acceptedApps = apps.filter(app => app.status ==='selected');
 
 // Load full details of these jobs to get the schedule date & times
 const jobsList = await Promise.all(
 acceptedApps.map(async (app) => {
 const job = await jobService.getJobById(app.jobId);
 return job;
 })
 );
 
 // Filter out nulls and sort by job date and start time
 const validJobs = jobsList.filter(Boolean);
 validJobs.sort((a, b) => {
 const dateA = a.jobDate ||'';
 const dateB = b.jobDate ||'';
 if (dateA !== dateB) return dateA.localeCompare(dateB);
 return (a.startTime ||'').localeCompare(b.startTime ||'');
 });

 setAcceptedJobs(validJobs);
 } catch (err) {
 console.error("Failed to load schedule:", err);
 setErrorMsg("Failed to load your schedule.");
 } finally {
 setLoading(false);
 }
 }, [currentUser]);

 useEffect(() => {
 const timer = setTimeout(() => {
 loadSchedule();
 }, 0);
 return () => clearTimeout(timer);
 }, [loadSchedule]);

 if (!currentUser) {
 return null;
 }

 const handleMarkCompleted = async (jobId) => {
 setErrorMsg('');
 setSuccessMsg('');
 try {
 await jobService.markJobCompletedByWorker(jobId);
 setSuccessMsg("Job marked as completed successfully! Awaiting employer confirmation.");
 await loadSchedule();
 setTimeout(() => setSuccessMsg(''), 5000);
 } catch (err) {
 console.error("Error marking job completed:", err);
 setErrorMsg("Failed to mark job completed.");
 }
 };

 // Date comparison helpers
 const getJobDateString = (dateStr) => {
 if (!dateStr) return'';
 try {
 const d = new Date(dateStr);
 return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
 } catch {
 return dateStr;
 }
 };

 // Convert 24h format to 12h AM/PM
 const formatTime12h = (timeStr) => {
 if (!timeStr) return'';
 const ampmMatch = timeStr.match(/(AM|PM)/i);
 if (ampmMatch) return timeStr; // Already formatted
 try {
 const [hStr, mStr] = timeStr.split(':');
 let h = parseInt(hStr, 10);
 const ampm = h >= 12 ?'PM' :'AM';
 h = h % 12;
 if (h === 0) h = 12;
 return `${String(h).padStart(2,'0')}:${mStr} ${ampm}`;
 } catch {
 return timeStr;
 }
 };

 const getFilteredJobs = () => {
 const now = new Date();
 
 // Today YYYY-MM-DD
 const todayStr = now.toISOString().split('T')[0];
 
 // Tomorrow YYYY-MM-DD
 const tom = new Date();
 tom.setDate(now.getDate() + 1);
 const tomorrowStr = tom.toISOString().split('T')[0];

 return acceptedJobs.filter(job => {
 const effStatus = jobService.getEffectiveJobStatus(job);
 const isCompleted = effStatus ==='Completed' || job.status ==='COMPLETED' || job.status ==='completed';
 
 if (filter ==='completed') {
 return isCompleted;
 }
 
 // If we are looking for non-completed jobs
 if (isCompleted) return false;

 if (filter ==='today') {
 return job.jobDate === todayStr;
 }
 if (filter ==='tomorrow') {
 return job.jobDate === tomorrowStr;
 }
 if (filter ==='upcoming') {
 // Exclude today and tomorrow
 return job.jobDate && job.jobDate !== todayStr && job.jobDate !== tomorrowStr;
 }
 return true;
 });
 };

 const filteredList = getFilteredJobs();

 return (
 <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-12">
 <div>
 <Navbar activeTab="" />

 <main className="max-w-xl mx-auto px-4 py-8">
 {/* Header Row */}
 <div className="flex items-center gap-3 mb-6">
 <button
 type="button"
 onClick={() => navigate('/dashboard')}
 className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shadow-sm"
 aria-label="Go Back"
 >
 <ChevronLeft size={20} />
 </button>
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">My Schedule</h1>
 </div>

 {/* Success and Error Alerts */}
 {successMsg && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-4 rounded-xl shadow-sm mb-5 flex items-center gap-2">
 <CheckCircle2 size={16} />
 <span>{successMsg}</span>
 </div>
 )}
 {errorMsg && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-xl shadow-sm mb-5 flex items-center gap-2">
 <AlertCircle size={16} />
 <span>{errorMsg}</span>
 </div>
 )}

 {/* Filter Pills */}
 <div className="flex flex-wrap gap-2.5 mb-6">
 {[
 { id:'today', label:'Today' },
 { id:'tomorrow', label:'Tomorrow' },
 { id:'upcoming', label:'Upcoming' },
 { id:'completed', label:'Completed' }
 ].map(pill => (
 <button
 key={pill.id}
 type="button"
 onClick={() => setFilter(pill.id)}
 className={`px-4.5 py-2 rounded-full text-xs font-bold border cursor-pointer ${
 filter === pill.id
 ?'bg-black border-black text-white shadow-sm'
 :'bg-white border-slate-200 text-slate-650'
 }`}
 >
 {pill.label}
 </button>
 ))}
 </div>

 {/* Schedule List */}
 {loading ? (
 <div className="space-y-4">
 {[1, 2].map(n => (
 <div key={n} className="bg-white border border-slate-100 p-5 rounded-2xl animate-pulse h-28"></div>
 ))}
 </div>
 ) : filteredList.length === 0 ? (
 <div className="bg-white border border-slate-200 border-dashed p-10 rounded-2xl text-center flex flex-col items-center gap-3">
 <Calendar size={36} className="text-slate-350" />
 <p className="text-sm font-semibold text-slate-500">No jobs scheduled for this period.</p>
 </div>
 ) : (
 <div className="space-y-4 text-left">
 {filteredList.map((job) => {
 const effStatus = jobService.getEffectiveJobStatus(job);
 
 // Set indicator dot color
 let dotColor ='bg-amber-500'; // Scheduled
 if (effStatus ==='Completed') dotColor ='bg-green-500';
 else if (effStatus ==='In Progress') dotColor ='bg-blue-500';
 else if (effStatus ==='Awaiting Employer Confirmation') dotColor ='bg-purple-500';

 // Check if worker can click mark completed
 const canMarkCompleted = effStatus ==='In Progress';

 return (
 <div 
 key={job.id} 
 className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-3.5"
 >
 {/* Time & Status Row */}
 <div className="flex items-center justify-between border-b border-slate-50 pb-2">
 <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
 <Clock size={14} className="text-slate-400" />
 <span>{formatTime12h(job.startTime)} – {formatTime12h(job.endTime)}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
 <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
 {effStatus}
 </span>
 </div>
 </div>

 {/* Job Details */}
 <div>
 <h3 className="font-extrabold text-slate-800 text-base leading-snug">{job.title}</h3>
 <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1">
 <User size={12} className="text-slate-400" />
 <span>Employer:</span>
 <span className="text-slate-700 font-bold">{job.employerName}</span>
 </div>
 <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-0.5">
 <Calendar size={12} className="text-slate-400" />
 <span>Date:</span>
 <span className="text-slate-700 font-bold">{getJobDateString(job.jobDate)}</span>
 </div>
 <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-1 leading-normal">
 <MapPin size={12} className="text-slate-350 shrink-0" />
 <span className="truncate">{job.formattedAddress || job.location}</span>
 </div>
 </div>

 {/* Action Button */}
 {effStatus !=='Completed' && (
 <div className="border-t border-slate-100 pt-3">
 {canMarkCompleted ? (
 <button
 type="button"
 onClick={() => handleMarkCompleted(job.id)}
 className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer text-center"
 >
 Mark as Completed
 </button>
 ) : effStatus ==='Awaiting Employer Confirmation' ? (
 <div className="text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] font-bold">
 ✓ Work Completed! Awaiting Employer Confirmation
 </div>
 ) : (
 <button
 disabled
 className="w-full bg-slate-100 text-slate-400 border border-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed text-center"
 title="Available once job start time has arrived"
 >
 Mark as Completed (Locked)
 </button>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </main>
 </div>
 </div>
 );
};

export default SchedulePage;
