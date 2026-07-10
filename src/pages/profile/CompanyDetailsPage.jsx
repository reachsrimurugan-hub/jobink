import { useState, useEffect, useCallback } from'react';
import { useNavigate } from'react-router-dom';
import { useAuth } from'../../contexts/AuthContext';
import { authService } from'../../services/db';
import Navbar from'../../components/Navbar';
import { ChevronLeft, Building2, User, CreditCard, Save, AlertCircle, CheckCircle2 } from'lucide-react';

const CompanyDetailsPage = () => {
 const navigate = useNavigate();
 const { currentUser, updateProfile, reloadProfile } = useAuth();

 // Basic Info States
 const [businessType, setBusinessType] = useState('Individual');
 const [description, setDescription] = useState('');
 const [infoLoading, setInfoLoading] = useState(false);
 const [infoSuccess, setInfoSuccess] = useState('');
 const [infoError, setInfoError] = useState('');

 // Credentials Requests States
 const [nameRequest, setNameRequest] = useState(null);
 const [newName, setNewName] = useState('');
 const [nameLoading, setNameLoading] = useState(false);
 const [nameError, setNameError] = useState('');
 const [nameSuccess, setNameSuccess] = useState('');

 const loadRequests = useCallback(async () => {
 if (!currentUser) return;
 try {
 const nReq = await authService.getNameChangeRequestForUser(currentUser.uid);
 setNameRequest(nReq);
 } catch (e) {
 console.warn("Failed to load company credential requests", e);
 }
 }, [currentUser]);

 useEffect(() => {
 if (currentUser) {
 const timer = setTimeout(() => {
 setBusinessType(currentUser.businessType ||'Individual');
 setDescription(currentUser.description ||'');
 loadRequests();
 }, 0);
 return () => clearTimeout(timer);
 }
 }, [currentUser, loadRequests]);

 if (!currentUser) {
   return null;
 }

 // Save Basic Bio & Business Type
 const handleSaveBasicInfo = async (e) => {
 e.preventDefault();
 setInfoLoading(true);
 setInfoSuccess('');
 setInfoError('');

 try {
 await updateProfile({
 businessType,
 description: description.trim()
 });
 await reloadProfile();
 setInfoSuccess('Company details updated successfully!');
 setTimeout(() => setInfoSuccess(''), 3000);
 } catch (err) {
 console.error(err);
 setInfoError('Failed to update details.');
 } finally {
 setInfoLoading(false);
 }
 };

 // Name Change request
 const handleRequestNameChange = async (e) => {
 e.preventDefault();
 setNameError('');
 setNameSuccess('');
 if (!newName.trim()) {
 setNameError('Please enter a valid company name.');
 return;
 }
 if (newName.trim() === currentUser.name) {
 setNameError('New name cannot be the same as current name.');
 return;
 }
 setNameLoading(true);
 try {
 await authService.requestNameChange(
 currentUser.uid,
 currentUser.name ||'',
 newName.trim(),
 currentUser.name ||'User'
 );
 setNameSuccess('Name change request submitted successfully to Admin.');
 await loadRequests();
 setNewName('');
 } catch (err) {
 console.error(err);
 setNameError('Failed to request name change.');
 } finally {
 setNameLoading(false);
 }
 };

 const handleResetNameRequest = async () => {
 setNameLoading(true);
 try {
 await authService.deleteNameChangeRequest(currentUser.uid);
 setNameRequest(null);
 setNameSuccess('');
 setNameError('');
 setNewName('');
 } catch (err) {
 console.error(err);
 setNameError('Failed to reset request.');
 } finally {
 setNameLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-12">
 <div>
 <Navbar activeTab="" />

 <main className="max-w-xl mx-auto px-4 py-8">
 {/* Header Row */}
 <div className="flex items-center gap-3 mb-6">
 <button
 type="button"
 onClick={() => navigate(-1)}
 className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shadow-sm"
 aria-label="Go Back"
 >
 <ChevronLeft size={20} />
 </button>
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Company Details</h1>
 </div>

 <div className="space-y-6">
 <p className="text-[14px] text-slate-500 leading-relaxed">
 Configure your business details, select profile types, or request identity edits for your employer account.
 </p>

 {/* 1. Basic details Form Card */}
 <form onSubmit={handleSaveBasicInfo} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-4">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
 <Building2 size={18} className="text-[#6D28D9]" />
 Profile Details
 </h2>

 {infoSuccess && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
 <CheckCircle2 size={15} />
 <span>{infoSuccess}</span>
 </div>
 )}
 {infoError && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
 <AlertCircle size={15} />
 <span>{infoError}</span>
 </div>
 )}

 {/* Employer / Business Type */}
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
 Employer Type
 </label>
 <div className="flex gap-4">
 <label className="flex-1 min-h-[44px] flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
 <input
 type="radio"
 name="businessType"
 value="Individual"
 checked={businessType ==='Individual'}
 onChange={() => setBusinessType('Individual')}
 className="accent-[#6D28D9]"
 />
 <span className="text-xs font-bold text-slate-700">Household Employer</span>
 </label>
 <label className="flex-1 min-h-[44px] flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
 <input
 type="radio"
 name="businessType"
 value="Business"
 checked={businessType ==='Business'}
 onChange={() => setBusinessType('Business')}
 className="accent-[#6D28D9]"
 />
 <span className="text-xs font-bold text-slate-700">Shop / Small Business</span>
 </label>
 </div>
 </div>

 {/* Bio/Description */}
 <div>
 <label htmlFor="description" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
 About Business / Requirements
 </label>
 <textarea
 id="description"
 rows={4}
 placeholder="Describe your household support needs or business listings here..."
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 disabled={infoLoading}
 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#6D28D9] focus:outline-none bg-slate-50/50 focus:bg-white leading-relaxed"
 />
 </div>

 <div className="border-t border-slate-100 pt-4 mt-6">
 <button
 type="submit"
 disabled={infoLoading}
 className="w-full bg-[#6D28D9] text-white font-bold py-3 rounded-xl text-[16px] shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
 >
 <Save size={16} />
 {infoLoading ?'Saving...' :'Save Details'}
 </button>
 </div>
 </form>

 {/* 2. Name Change Request Card */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
 <User size={18} className="text-[#6D28D9]" />
 Employer Name Request
 </h2>
 {nameError && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-1.5">
 <AlertCircle size={14} />
 <span>{nameError}</span>
 </div>
 )}
 {nameSuccess && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-3 rounded-xl flex items-center gap-1.5">
 <CheckCircle2 size={14} />
 <span>{nameSuccess}</span>
 </div>
 )}

 <div className="text-xs">
 <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Current Verified Name</span>
 <strong className="text-slate-800 text-base font-bold block mt-0.5">{currentUser?.name}</strong>
 </div>

 {!nameRequest ? (
 <form onSubmit={handleRequestNameChange} className="space-y-3.5">
 <p className="text-slate-500 text-xs leading-relaxed">
 Updates require administrative audit to verify credentials safety.
 </p>
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Enter new full name"
 value={newName}
 onChange={(e) => setNewName(e.target.value)}
 disabled={nameLoading}
 className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-[#6D28D9] focus:outline-none"
 required
 />
 <button
 type="submit"
 disabled={nameLoading}
 className="bg-[#6D28D9] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer shrink-0"
 >
 {nameLoading ?'Requesting...' :'Request'}
 </button>
 </div>
 </form>
 ) : (
 <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
 <div className="flex items-center gap-2">
 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
 nameRequest.status ==='pending'
 ?'bg-amber-50 text-amber-700 border-amber-200'
 : nameRequest.status ==='approved'
 ?'bg-green-50 text-green-700 border-green-200'
 :'bg-red-50 text-red-700 border-red-200'
 }`}>
 {nameRequest.status}
 </span>
 <span className="text-xs text-slate-550 font-bold">Name Update Request</span>
 </div>

 <div className="text-xs text-slate-600">
 Requested Name: <strong className="text-slate-800">{nameRequest.newName}</strong>
 </div>

 {nameRequest.status ==='pending' && (
 <div className="flex flex-col gap-2">
 <p className="text-[10px] text-slate-400 italic">
 Awaiting approval.
 </p>
 <button
 type="button"
 onClick={handleResetNameRequest}
 disabled={nameLoading}
 className="bg-white border border-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer w-full text-center"
 >
 Cancel Request
 </button>
 </div>
 )}

 {nameRequest.status ==='rejected' && (
 <div className="space-y-2">
 <p className="text-xs text-red-800 bg-red-100/50 p-2.5 rounded border border-red-200 font-semibold">
 Reason: {nameRequest.rejectionReason ||'No reason provided.'}
 </p>
 <button
 type="button"
 onClick={handleResetNameRequest}
 disabled={nameLoading}
 className="bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs w-full cursor-pointer"
 >
 Reset / Reapply
 </button>
 </div>
 )}
 </div>
 )}
 </div>

 </div>
 </main>
 </div>
 </div>
 );
};

export default CompanyDetailsPage;
