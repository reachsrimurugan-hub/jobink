import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, reportService, queryService } from '../services/db';
import Navbar from '../components/Navbar';
import { ArrowLeft, CheckCircle, XCircle, FileText, Image, Phone, MapPin, AlertTriangle, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingPhoneChanges, setPendingPhoneChanges] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [queries, setQueries] = useState([]);
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

      const reports = await reportService.getPendingReports();
      setPendingReports(reports);

      const userQueries = await queryService.getAllQueries();
      setQueries(userQueries);
      
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
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h2 className="font-extrabold text-slate-800 text-xl flex items-center gap-2">
            🛡️ Admin Control panel
          </h2>
          <p className="text-slate-500 text-xs mt-1">Audit profile credentials, verified badges, and sensitive phone updates.</p>
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

                        <div className="text-xs text-slate-600 space-y-2 border-t border-slate-50 pt-3">
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
                            <span>Aadhaar: <strong className="text-slate-700 font-mono tracking-wide">{user.aadhaarNumber}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Column: Uploaded Document Previews */}
                      <div className="flex gap-4 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Face Photo</span>
                          {user.profilePhotoUrl ? (
                            <a href={user.profilePhotoUrl} target="_blank" rel="noreferrer">
                              <img src={user.profilePhotoUrl} alt="Face" className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm" />
                            </a>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <Image size={18} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 text-center flex-1 min-w-[120px]">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Aadhaar Card</span>
                          {user.aadhaarPhotoUrl ? (
                            <a href={user.aadhaarPhotoUrl} target="_blank" rel="noreferrer">
                              <img src={user.aadhaarPhotoUrl} alt="Aadhaar" className="h-16 w-full max-w-[150px] rounded-lg object-cover border border-slate-200 shadow-sm" />
                            </a>
                          ) : (
                            <div className="h-16 w-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 rounded-lg">
                              <Image size={18} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Actions */}
                      <div className="border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 flex md:flex-col justify-end gap-2 shrink-0 md:w-36">
                        <button
                          type="button"
                          onClick={() => handleReject(user.uid)}
                          disabled={loading}
                          className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-100 touch-target"
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(user.uid)}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
