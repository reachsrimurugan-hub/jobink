import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/db';
import Navbar from '../components/Navbar';
import { ArrowLeft, CheckCircle, XCircle, FileText, Image, Phone, MapPin } from 'lucide-react';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const loadPendingQueue = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsersByStatus('pending');
      setPendingUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending verifications.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingQueue();
  }, []);

  const handleApprove = async (uid) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await authService.verifyUser(uid, true);
      setSuccess('User profile approved successfully!');
      await loadPendingQueue();
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
      await loadPendingQueue();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Verification rejection failed.');
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
            🛡️ Identity Verification Panel
          </h2>
          <p className="text-slate-500 text-xs mt-1">Review uploaded Aadhaar proofs and profile photos to issue verified badges.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100 mb-5">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-xs font-semibold p-3 rounded-lg border border-green-100 mb-5">
            {success}
          </div>
        )}

        {/* Pending List */}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
