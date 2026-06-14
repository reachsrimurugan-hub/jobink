import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, reportService, queryService, disputeService, jobService } from '../services/db';
import Navbar from '../components/Navbar';
import { ArrowLeft, CheckCircle, XCircle, FileText, Image, Phone, MapPin, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingPhoneChanges, setPendingPhoneChanges] = useState([]);
  const [pendingPhotoChanges, setPendingPhotoChanges] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [queries, setQueries] = useState([]);
  const [pendingDisputes, setPendingDisputes] = useState([]);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('identity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const verifications = await authService.getUsersByStatus('pending');
      setPendingUsers(verifications);

      const phoneChanges = await authService.getPendingPhoneChanges();
      setPendingPhoneChanges(phoneChanges);

      const photoChanges = await authService.getPendingPhotoChanges();
      setPendingPhotoChanges(photoChanges);

      const reports = await reportService.getPendingReports();
      setPendingReports(reports);

      const userQueries = await queryService.getAllQueries();
      setQueries(userQueries);

      const flagged = await authService.getFlaggedUsers();
      setFlaggedUsers(flagged);

      const activeDisputes = await disputeService.getPendingDisputes();
      const enrichedDisputes = await Promise.all(activeDisputes.map(async (disp) => {
        const [empDoc, wrkDoc, job] = await Promise.all([
          authService.getCurrentUser(disp.employerId),
          authService.getCurrentUser(disp.workerId),
          jobService.getJobById(disp.jobId)
        ]);
        return {
          ...disp,
          employer: empDoc || { name: 'Unknown Employer', trustScore: 0, completedJobs: 0, disputesRaised: 0 },
          worker: wrkDoc || { name: 'Unknown Worker', completedJobs: 0, disputesRaised: 0 },
          job: job || { title: 'Unknown Job', payment: 0, status: 'unknown' }
        };
      }));
      setPendingDisputes(enrichedDisputes);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load queue data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveUser = async (uid, reportId) => {
    setError('');
    setSuccess('');
    if (!window.confirm("Are you sure you want to permanently remove this user from the platform? This action cannot be undone.")) {
      return;
    }
    try {
      setLoading(true);
      await reportService.removeUser(uid);
      setSuccess('User removed and associated pending reports resolved!');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to remove user.');
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await reportService.resolveReport(reportId);
      setSuccess('Report resolved successfully.');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to resolve report.');
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId, resolution) => {
    setError('');
    setSuccess('');
    let confirmMsg = "Are you sure you want to resolve this dispute?";
    if (resolution === 'favor_worker') {
      confirmMsg = "Resolve in worker's favor? This will decrease employer trust score by 1, and increment worker completed jobs & trust score.";
    } else if (resolution === 'favor_employer') {
      confirmMsg = "Resolve in employer's favor? This will decrease worker trust score by 1 (false dispute), and increment employer trust score.";
    } else {
      confirmMsg = "Close dispute neutrally? No trust score changes will be applied.";
    }
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      await disputeService.resolveDispute(disputeId, resolution);
      setSuccess(`Dispute resolved successfully (${resolution})!`);
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to resolve dispute.');
      setLoading(false);
    }
  };

  const handleApprove = async (uid) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.verifyUser(uid, true);
      setSuccess('User profile approved successfully!');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Verification approval failed.');
      setLoading(false);
    }
  };

  const handleReject = async (uid) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.verifyUser(uid, false);
      setSuccess('User profile verification rejected.');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Verification rejection failed.');
      setLoading(false);
    }
  };

  const handleVerifySelfie = async (uid, isApproved) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.verifySelfie(uid, isApproved);
      setSuccess(`Selfie verification ${isApproved ? 'approved' : 'rejected'}!`);
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Selfie verification update failed.');
      setLoading(false);
    }
  };

  const handleVerifyUpi = async (uid, isApproved) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.verifyUpi(uid, isApproved);
      setSuccess(`UPI verification ${isApproved ? 'approved' : 'rejected'}!`);
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('UPI verification update failed.');
      setLoading(false);
    }
  };

  const handleRunMigration = async () => {
    setError('');
    setSuccess('');
    if (!window.confirm("Are you sure you want to run the trust score migration for all existing users in the database?")) {
      return;
    }
    try {
      setLoading(true);
      const migratedCount = await authService.runTrustMigration();
      setSuccess(`Migration completed! Successfully recalculated trust scores for ${migratedCount} users.`);
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Migration failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handlePhoneApprove = async (requestId) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.updatePhoneChangeStatus(requestId, 'approved');
      setSuccess('Phone change request approved successfully!');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to approve phone change request.');
      setLoading(false);
    }
  };

  const handlePhoneReject = async (requestId) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.updatePhoneChangeStatus(requestId, 'rejected');
      setSuccess('Phone change request rejected.');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to reject phone change request.');
      setLoading(false);
    }
  };

  const handlePhotoApprove = async (requestId) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.updatePhotoChangeStatus(requestId, 'approved');
      setSuccess('Profile photo change request approved successfully!');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to approve profile photo change request.');
      setLoading(false);
    }
  };

  const handlePhotoReject = async (requestId) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.updatePhotoChangeStatus(requestId, 'rejected');
      setSuccess('Profile photo change request rejected.');
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to reject profile photo change request.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar activeTab="" />

      <main className="max-w-4xl mx-auto px-4 py-8 text-left">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-6 touch-target"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="font-extrabold text-slate-800 text-xl flex items-center gap-2">
              🛡️ Admin Control panel
            </h2>
            <p className="text-slate-500 text-xs mt-1">Audit profile credentials, verified badges, and sensitive phone updates.</p>
          </div>
          <button
            type="button"
            onClick={handleRunMigration}
            disabled={loading}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer touch-target shrink-0"
          >
            🔄 Run Trust Migration
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100 mb-5 animate-pulse">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-xs font-semibold p-3 rounded-lg border border-green-100 mb-5">
            {success}
          </div>
        )}

        {/* Sub-tabs Selector */}
        <div className="flex gap-4 border-b border-slate-200 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('identity')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'identity'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🛡️ Identity Verifications ({pendingUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('phone')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'phone'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📞 Phone Change Requests ({pendingPhoneChanges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('profilePhotos')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'profilePhotos'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🖼️ Profile Photos ({pendingPhotoChanges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('reports')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'reports'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚠️ User Reports ({pendingReports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('queries')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'queries'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            💬 User Queries ({queries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('disputes')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'disputes'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🛡️ Disputes ({pendingDisputes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('flagged')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'flagged'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🚩 Flagged Users ({flaggedUsers.length})
          </button>
        </div>

        {/* Tab 1: Identity Verification Queue */}
        {activeSubTab === 'identity' && (
          <div>
            {loading && pendingUsers.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">Verification Queue is Empty!</p>
                <p className="text-xs text-slate-400">All registered users are currently reviewed and audited.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Pending Requests ({pendingUsers.length})
                </h3>
                
                <div className="flex flex-col gap-4">
                  {pendingUsers.map((user) => (
                    <div key={user.uid} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 justify-between">
                      {/* Left Column: Info */}
                      <div className="flex-1 space-y-3.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-800 text-base leading-snug">{user.name}</h4>
                            <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {user.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">UID: {user.uid}</span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-2 border-t border-slate-50 pt-3 text-left">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span className="font-medium">{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <span>{user.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400" />
                            <span>UPI ID: <strong className="text-slate-700 font-mono tracking-wide">{user.upiId || 'Not Provided'}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trust Score:</span>
                            <strong className="text-slate-700">{user.trustScore ?? 0}/100</strong>
                          </div>
                        </div>
                      </div>

                      {/* Middle Column: Selfie and UPI QR Previews with individual actions */}
                      <div className="flex gap-6 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 items-start flex-wrap">
                        {/* Selfie Section */}
                        <div className="flex flex-col gap-2 text-center items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Selfie Photo</span>
                          {user.selfieUrl ? (
                            <a href={user.selfieUrl} target="_blank" rel="noreferrer">
                              <img src={user.selfieUrl} alt="Selfie" className="w-18 h-18 rounded-lg object-cover border border-slate-200 shadow-sm" />
                            </a>
                          ) : (
                            <div className="w-18 h-18 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <Image size={18} />
                            </div>
                          )}
                          <div className="flex flex-col gap-1 mt-1">
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              user.selfieVerified 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {user.selfieVerified ? 'Selfie Verified' : 'Selfie Pending'}
                            </span>
                            <div className="flex gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleVerifySelfie(user.uid, false)}
                                disabled={loading}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold border border-red-100 cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerifySelfie(user.uid, true)}
                                disabled={loading}
                                className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold border border-green-100 cursor-pointer"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* UPI QR Section */}
                        <div className="flex flex-col gap-2 text-center items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">UPI QR Code</span>
                          {user.upiQrUrl ? (
                            <a href={user.upiQrUrl} target="_blank" rel="noreferrer">
                              <img src={user.upiQrUrl} alt="UPI QR" className="w-18 h-18 rounded-lg object-contain border border-slate-200 shadow-sm bg-white p-1" />
                            </a>
                          ) : (
                            <div className="w-18 h-18 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <Image size={18} />
                            </div>
                          )}
                          <div className="flex flex-col gap-1 mt-1">
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              user.upiVerified 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {user.upiVerified ? 'UPI Verified' : 'UPI Pending'}
                            </span>
                            <div className="flex gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleVerifyUpi(user.uid, false)}
                                disabled={loading}
                                className="bg-red-50 hover:bg-red-100 text-red-650 px-2 py-1 rounded text-[10px] font-bold border border-red-100 cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerifyUpi(user.uid, true)}
                                disabled={loading}
                                className="bg-green-50 hover:bg-green-100 text-green-650 px-2 py-1 rounded text-[10px] font-bold border border-green-100 cursor-pointer"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Actions */}
                      <div className="border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 flex md:flex-col justify-end gap-2 shrink-0 md:w-36">
                        <button
                          type="button"
                          onClick={() => handleReject(user.uid)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-200 touch-target cursor-pointer"
                        >
                          <XCircle size={15} />
                          Reject Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(user.uid)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm touch-target cursor-pointer"
                        >
                          <CheckCircle size={15} />
                          Approve Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Phone Change Requests Queue */}
        {activeSubTab === 'phone' && (
          <div>
            {loading && pendingPhoneChanges.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : pendingPhoneChanges.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">No Phone Change Requests!</p>
                <p className="text-xs text-slate-400">All submitted number change requests have been processed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Pending Change Requests ({pendingPhoneChanges.length})
                </h3>
                
                <div className="flex flex-col gap-4">
                  {pendingPhoneChanges.map((req) => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-base leading-snug">{req.userName}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">UID: {req.uid}</span>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap gap-4 items-center pt-1 border-t border-slate-50">
                          <div>
                            <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Current Phone</span>
                            <span className="font-mono font-bold text-slate-700">{req.oldPhone || 'N/A'}</span>
                          </div>
                          <div className="text-slate-300 font-light text-lg">→</div>
                          <div>
                            <span className="text-primary font-bold block uppercase text-[9px] mb-0.5">Requested New Phone</span>
                            <span className="font-mono font-bold text-primary">{req.newPhone}</span>
                          </div>
                          <div className="ml-auto text-[10px] text-slate-400">
                            Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto shrink-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handlePhoneReject(req.id)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-100 touch-target"
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePhoneApprove(req.id)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm touch-target"
                        >
                          <CheckCircle size={15} />
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: User Reports Queue */}
        {activeSubTab === 'reports' && (
          <div>
            {loading && pendingReports.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : pendingReports.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">No Pending User Reports!</p>
                <p className="text-xs text-slate-400">All submitted reports have been reviewed and audited.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Pending Reports ({pendingReports.length})
                </h3>
                
                <div className="flex flex-col gap-4">
                  {pendingReports.map((rep) => (
                    <div key={rep.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                            {rep.reason}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            Reported: <span className="text-slate-900">{rep.reportedName}</span>
                          </h4>
                          <span className="text-[10px] text-slate-400">UID: {rep.reportedId}</span>
                        </div>
                        
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-lg italic">
                          "{rep.details}"
                        </p>
                        
                        <div className="text-[10px] text-slate-500 flex gap-4">
                          <span>Reported by: <strong>{rep.reporterName}</strong> (UID: {rep.reporterId})</span>
                          <span>•</span>
                          <span>Date: {new Date(rep.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto shrink-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-200 touch-target cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(rep.reportedId, rep.id)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm touch-target cursor-pointer"
                        >
                          Remove User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: User Queries */}
        {activeSubTab === 'queries' && (
          <div>
            {loading && queries.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : queries.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">No User Queries Found!</p>
                <p className="text-xs text-slate-400">Users have not submitted any queries to the admin yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  User Queries ({queries.length})
                </h3>
                
                <div className="flex flex-col gap-4">
                  {queries.map((q) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-3 text-left">
                      <div className="flex justify-between items-start gap-2 flex-wrap pb-2 border-b border-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-800 text-sm">{q.userName}</h4>
                            <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded border ${
                              q.userRole === 'worker' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {q.userRole}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Phone: {q.userPhone || 'N/A'} | UID: {q.userId}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(q.createdAt).toLocaleDateString('en-IN')} {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-700 bg-slate-50 border border-slate-100/50 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap">
                        {q.queryText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Disputes Queue */}
        {activeSubTab === 'disputes' && (
          <div>
            {loading && pendingDisputes.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : pendingDisputes.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">No Pending Disputes!</p>
                <p className="text-xs text-slate-400">All payment disputes have been resolved.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Payment Disputes Under Audit ({pendingDisputes.length})
                </h3>
                
                <div className="flex flex-col gap-5">
                  {pendingDisputes.map((disp) => (
                    <div key={disp.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      {/* Top Header Row */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div>
                          <span className="bg-red-50 text-red-750 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                            Disputed
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-sm mt-1">{disp.job?.title || 'Job Title'}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Job ID: {disp.jobId} | Dispute ID: {disp.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Expected Payment</span>
                          <span className="text-sm font-extrabold text-slate-900">₹{disp.job?.payment || disp.job?.amount || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Info Sections: Employer vs Worker */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-3 text-xs">
                        {/* Employer Info */}
                        <div className="space-y-2 border-r border-slate-105 pr-2">
                          <h5 className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">Employer Details</h5>
                          <p className="font-bold text-slate-850">{disp.employer?.name || 'Name not loaded'}</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                            <div>Trust Score: <strong className="text-slate-700">{disp.employer?.trustScore ?? 0}</strong></div>
                            <div>Completed: <strong className="text-slate-700">{disp.employer?.completedJobs ?? 0}</strong></div>
                            <div>Disputes Count: <strong className="text-red-650">{disp.employer?.disputesRaised ?? 0}</strong></div>
                          </div>
                        </div>

                        {/* Worker Info */}
                        <div className="space-y-2">
                          <h5 className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">Worker Details</h5>
                          <p className="font-bold text-slate-850">{disp.worker?.name || 'Name not loaded'}</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                            <div>Trust Score: <strong className="text-slate-700">{disp.worker?.trustScore ?? 0}</strong></div>
                            <div>Completed: <strong className="text-slate-700">{disp.worker?.completedJobs ?? 0}</strong></div>
                            <div>Disputes Raised: <strong className="text-red-650">{disp.worker?.disputesRaised ?? 0}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Payment UPI Details */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2">
                        <h5 className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">Payment Details (Entered by Employer)</h5>
                        <div className="grid grid-cols-2 gap-2 leading-relaxed text-slate-600">
                          <div>Amount Transferred: <strong className="text-slate-800 font-bold">₹{disp.job?.paymentAmount || 'N/A'}</strong></div>
                          <div>Payment Type: <strong className="text-slate-800 font-bold">Direct UPI</strong></div>
                          <div className="col-span-2">Paid Timestamp: <span className="font-semibold">{disp.job?.paidAt ? new Date(disp.job.paidAt).toLocaleString('en-IN') : 'N/A'}</span></div>
                        </div>
                      </div>

                      {/* Dispute Statements: Worker Claim & Employer Response */}
                      <div className="space-y-3 pt-1">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-red-600 mb-1">Worker Claim (Reason: {disp.reason})</span>
                          <p className="bg-red-50 border border-red-100 p-3 rounded-lg text-xs italic text-slate-700 font-medium">
                            "{disp.workerComment || 'No comments provided'}"
                          </p>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-indigo-600 mb-1">Employer Response/Proof</span>
                          <p className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs italic text-slate-700 font-medium">
                            "{disp.employerResponse || 'Awaiting employer response...'}"
                          </p>
                        </div>
                      </div>

                      {/* Admin Resolutions Actions */}
                      <div className="border-t border-slate-100 pt-4 flex gap-2 flex-wrap md:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handleResolveDispute(disp.id, 'favor_worker')}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm touch-target cursor-pointer"
                        >
                          Resolve in Favor of Worker
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveDispute(disp.id, 'favor_employer')}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm touch-target cursor-pointer"
                        >
                          Resolve in Favor of Employer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveDispute(disp.id, 'close')}
                          disabled={loading}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center border border-slate-200 touch-target cursor-pointer"
                        >
                          Close Dispute (No Penalty)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Profile Photo Change Requests Queue */}
        {activeSubTab === 'profilePhotos' && (
          <div>
            {loading && pendingPhotoChanges.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : pendingPhotoChanges.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">Photo Queue is Empty!</p>
                <p className="text-xs text-slate-400">All profile photo update requests have been reviewed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Pending Photo Change Requests ({pendingPhotoChanges.length})
                </h3>
                
                <div className="flex flex-col gap-4">
                  {pendingPhotoChanges.map((req) => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-base leading-snug">{req.userName}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">User ID: {req.userId}</span>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap gap-6 items-center pt-3 border-t border-slate-100">
                          <div className="text-center">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Current Photo</span>
                            {req.oldPhotoUrl ? (
                              <img src={req.oldPhotoUrl} alt="Old profile" className="w-14 h-14 rounded-full object-cover border border-slate-200 mx-auto" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] mx-auto">None</div>
                            )}
                          </div>
                          <div className="text-slate-300 font-bold text-lg">→</div>
                          <div className="text-center">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Requested Photo</span>
                            <img src={req.newPhotoUrl} alt="New profile" className="w-14 h-14 rounded-full object-cover border border-slate-200 mx-auto" />
                          </div>
                          <div className="ml-auto text-[10px] text-slate-400 self-end">
                            Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto shrink-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handlePhotoReject(req.id)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-100 touch-target cursor-pointer"
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePhotoApprove(req.id)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm touch-target cursor-pointer"
                        >
                          <CheckCircle size={15} />
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Flagged Users */}
        {activeSubTab === 'flagged' && (
          <div>
            {loading && flaggedUsers.length === 0 ? (
              <div className="py-12 flex justify-center items-center">
                <div className="spinner"></div>
              </div>
            ) : flaggedUsers.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-xl text-center flex flex-col items-center gap-3">
                <CheckCircle className="text-green-500" size={36} />
                <p className="text-sm font-bold text-slate-700">No Flagged Users!</p>
                <p className="text-xs text-slate-400">All users are in good standing.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Flagged Accounts ({flaggedUsers.length})
                </h3>
                
                <div className="flex flex-col gap-4">
                  {flaggedUsers.map((user) => (
                    <div key={user.uid} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {user.name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {user.role}
                          </span>
                          <span className="text-[10px] text-slate-400">UID: {user.uid}</span>
                        </div>
                        
                        <p className="text-xs text-red-750 bg-red-50 border border-red-100 p-3 rounded-lg font-semibold">
                          Reason: {user.flagReason || "No reason specified"}
                        </p>
                        
                        <div className="text-[11px] text-slate-505 flex gap-4">
                          <span>Phone: <strong>{user.phone || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>Trust Score: <strong>{user.trustScore ?? 0}/100</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto shrink-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to unflag ${user.name}?`)) {
                              try {
                                setLoading(true);
                                await authService.unflagUser(user.uid);
                                setSuccess(`User ${user.name} has been unflagged.`);
                                await loadData();
                              } catch (err) {
                                console.error(err);
                                setError('Failed to unflag user.');
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-200 touch-target cursor-pointer"
                        >
                          Unflag User
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.uid)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm touch-target cursor-pointer"
                        >
                          Remove Account
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
