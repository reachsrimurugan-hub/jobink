import { useState, useEffect, useCallback } from'react';
import { useNavigate } from'react-router-dom';
import { useAuth } from'../../contexts/AuthContext';
import { authService } from'../../services/db';
import Navbar from'../../components/Navbar';
import { ChevronLeft, Shield, User, Phone, Camera, Upload, AlertCircle, CheckCircle2 } from'lucide-react';

// Client-side image compression helper using HTML5 Canvas
const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
 return new Promise((resolve) => {
 const img = new Image();
 img.src = base64Str;
 img.onload = () => {
 let width = img.width;
 let height = img.height;

 if (width > height) {
 if (width > maxWidth) {
 height = Math.round((height * maxWidth) / width);
 width = maxWidth;
 }
 } else {
 if (height > maxHeight) {
 width = Math.round((width * maxHeight) / height);
 height = maxHeight;
 }
 }

 const canvas = document.createElement('canvas');
 canvas.width = width;
 canvas.height = height;

 const ctx = canvas.getContext('2d');
 ctx.drawImage(img, 0, 0, width, height);

 // Compress to 70% quality jpeg
 resolve(canvas.toDataURL('image/jpeg', 0.7));
 };
 });
};

const SecurityPage = () => {
 const navigate = useNavigate();
 const { currentUser, reloadProfile } = useAuth();

 // Requests States
 const [nameRequest, setNameRequest] = useState(null);
 const [newName, setNewName] = useState('');
 const [nameLoading, setNameLoading] = useState(false);
 const [nameError, setNameError] = useState('');
 const [nameSuccess, setNameSuccess] = useState('');



 const [phoneRequest, setPhoneRequest] = useState(null);
 const [newPhone, setNewPhone] = useState('');
 const [phoneLoading, setPhoneLoading] = useState(false);
 const [phoneError, setPhoneError] = useState('');
 const [phoneSuccess, setPhoneSuccess] = useState('');
 const [otpSent, setOtpSent] = useState(false);
 const [changeOtp, setChangeOtp] = useState('');

 // Re-verification states

 const [reSelfie, setReSelfie] = useState('');
 const [reVerifLoading, setReVerifLoading] = useState(false);
 const [reVerifError, setReVerifError] = useState('');
 const [reVerifSuccess, setReVerifSuccess] = useState('');

 const loadRequests = useCallback(async () => {
 if (!currentUser) return;
 try {
 const pReq = await authService.getPhoneChangeRequestForUser(currentUser.uid);
 setPhoneRequest(pReq);
 const nReq = await authService.getNameChangeRequestForUser(currentUser.uid);
 setNameRequest(nReq);
 } catch (e) {
 console.warn("Failed to load credentials requests", e);
 }
 }, [currentUser]);

 useEffect(() => {
 const timer = setTimeout(() => {
 loadRequests();
 }, 0);
 return () => clearTimeout(timer);
 }, [loadRequests]);

 if (!currentUser) {
    return null;
  }

 // Image upload handler
 const handleFileChange = (e, setter) => {
 const file = e.target.files[0];
 if (file) {
 const reader = new FileReader();
 reader.onload = (event) => {
 setter(event.target.result);
 };
 reader.readAsDataURL(file);
 }
 };

 // 1. Name Change Logic
 const handleRequestNameChange = async (e) => {
 e.preventDefault();
 setNameError('');
 setNameSuccess('');
 if (!newName.trim()) {
 setNameError('Please enter a valid name.');
 return;
 }
 if (newName.trim() === currentUser.name) {
 setNameError('New name cannot be the same as your current name.');
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



 // 3. Phone Change Logic
 const handleRequestPhoneChange = async (e) => {
 e.preventDefault();
 setPhoneError('');
 setPhoneSuccess('');
 
 const sanitized = newPhone.replace(/[^0-9]/g,'');
 if (sanitized.length !== 10) {
 setPhoneError('Please enter a valid 10-digit phone number.');
 return;
 }
 
 const formattedPhone = `+91${sanitized}`;
 if (formattedPhone === currentUser.phone) {
 setPhoneError('New phone number cannot be the same as your current phone number.');
 return;
 }
 
 setPhoneLoading(true);
 try {
 const req = await authService.requestPhoneChange(
 currentUser.uid,
 currentUser.phone ||'',
 formattedPhone,
 currentUser.name ||'User'
 );
 setPhoneRequest(req);
 setPhoneSuccess('Change request submitted to Admin successfully.');
 setNewPhone('');
 } catch (err) {
 console.error(err);
 setPhoneError('Failed to request phone change.');
 } finally {
 setPhoneLoading(false);
 }
 };

 const handleSendPhoneChangeOTP = () => {
 setPhoneLoading(true);
 setPhoneError('');
 setPhoneSuccess('');
 setTimeout(() => {
 setOtpSent(true);
 setPhoneSuccess('OTP sent to' + phoneRequest.newPhone);
 setPhoneLoading(false);
 }, 800);
 };

 const handleVerifyPhoneChangeOTP = async (e) => {
 e.preventDefault();
 setPhoneError('');
 setPhoneSuccess('');
 
 if (changeOtp !=='123456') {
 setPhoneError('Invalid OTP code. Please enter the correct OTP (123456 for testing).');
 return;
 }
 
 setPhoneLoading(true);
 try {
 await authService.completePhoneChange(currentUser.uid, phoneRequest.uid, phoneRequest.newPhone);
 setPhoneSuccess('Phone number updated successfully!');
 setNewPhone('');
 setOtpSent(false);
 setChangeOtp('');
 
 await reloadProfile();
 await loadRequests();
 } catch (err) {
 console.error(err);
 setPhoneError('Failed to update phone number.');
 } finally {
 setPhoneLoading(false);
 }
 };

 const handleResetPhoneRequest = async () => {
 setPhoneLoading(true);
 try {
 await authService.deletePhoneChangeRequest(currentUser.uid);
 setPhoneRequest(null);
 setNewPhone('');
 setOtpSent(false);
 setChangeOtp('');
 } catch (err) {
 console.error(err);
 setPhoneError('Failed to reset request.');
 } finally {
 setPhoneLoading(false);
 }
 };

 // 4. Re-submit Trust Verification Details
 const handleReSubmitVerification = async (e) => {
 e.preventDefault();
 setReVerifError('');
 setReVerifSuccess('');

 if (!reSelfie) {
 setReVerifError('Selfie photo is required.');
 return;
 }

 setReVerifLoading(true);
 try {
 const compressedSelfie = await compressImage(reSelfie, 800, 800);

 await authService.saveUserProfile(currentUser.uid, {
 selfieUrl: compressedSelfie,
 selfieVerified: false,
 verificationStatus:'pending',
 verified: false
 });
 setReVerifSuccess('Trust verification details re-submitted successfully!');
 setReSelfie('');
 await reloadProfile();
 } catch (err) {
 console.error(err);
 setReVerifError('Failed to re-submit trust verification details.');
 } finally {
 setReVerifLoading(false);
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
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Privacy & Security</h1>
 </div>

 <div className="space-y-6">
 <p className="text-[14px] text-slate-500 leading-relaxed">
 Manage your verified credentials, update sensitive details, or re-submit trust validation files to the administrator queue.
 </p>

 {/* A. Re-verification section (If rejected) */}
 {currentUser?.verificationStatus ==='rejected' && (
 <div className="bg-red-50/70 border border-red-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
 <h3 className="font-extrabold text-red-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
 <Shield size={18} />
 Re-Submit Trust Verification Details
 </h3>
 <p className="text-slate-600 text-xs leading-relaxed font-medium">
 Your verification details were rejected. Please update your UPI ID, select a new selfie, and upload.
 </p>
 {currentUser.rejectionReason && (
 <p className="bg-red-100 text-red-800 text-xs font-semibold p-2.5 rounded-lg border border-red-200">
 Reason: {currentUser.rejectionReason}
 </p>
 )}
 {reVerifError && (
 <div className="bg-red-100 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-lg flex items-center gap-1.5">
 <AlertCircle size={14} />
 <span>{reVerifError}</span>
 </div>
 )}
 {reVerifSuccess && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-3 rounded-lg flex items-center gap-1.5">
 <CheckCircle2 size={14} />
 <span>{reVerifSuccess}</span>
 </div>
 )}

 <form onSubmit={handleReSubmitVerification} className="space-y-4">


 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
 Selfie Verification
 </label>
 <div className="border border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center gap-2 bg-white h-24 relative">
 {reSelfie ? (
 <div className="text-center w-full relative">
 <img src={reSelfie} alt="Selfie preview" className="w-10 h-10 rounded-full object-cover mx-auto border border-slate-200" />
 <span className="text-[9px] text-green-600 font-bold block mt-1">✓ Selfie Captured</span>
 <button
 type="button"
 onClick={() => setReSelfie('')}
 className="text-[9px] text-red-500 font-bold block mx-auto mt-0.5"
 >
 Clear
 </button>
 </div>
 ) : (
 <div className="w-full h-full flex gap-3">
 <label className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-1 border border-slate-100 bg-slate-50 rounded-lg text-center p-1.5">
 <Camera size={18} className="text-[#6D28D9]" />
 <span className="text-[10px] font-bold text-slate-700">Take Selfie</span>
 <input
 type="file"
 accept="image/*"
 capture="user"
 onChange={(e) => handleFileChange(e, setReSelfie)}
 className="hidden"
 required
 />
 </label>
 <label className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-1 border border-slate-100 bg-slate-50 rounded-lg text-center p-1.5">
 <Upload size={18} className="text-slate-500" />
 <span className="text-[10px] font-bold text-slate-700">Upload Photo</span>
 <input
 type="file"
 accept="image/*"
 onChange={(e) => handleFileChange(e, setReSelfie)}
 className="hidden"
 required
 />
 </label>
 </div>
 )}
 </div>
 </div>

 <button
 type="submit"
 disabled={reVerifLoading}
 className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
 >
 {reVerifLoading ?'Submitting Details...' :'Re-Submit Verification Details'}
 </button>
 </form>
 </div>
 )}

 {/* B. Name Change Request Card */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
 <User size={18} className="text-[#6D28D9]" />
 Name Update Request
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
 Name updates require administrator audit approval to ensure your account details align with verified document records.
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
 Awaiting administrator verification. You will be updated once approved.
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



 {/* D. Phone Number Change Card */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
 <Phone size={18} className="text-[#6D28D9]" />
 Registered Mobile Update
 </h2>
 {phoneError && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-1.5">
 <AlertCircle size={14} />
 <span>{phoneError}</span>
 </div>
 )}
 {phoneSuccess && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-3 rounded-xl flex items-center gap-1.5">
 <CheckCircle2 size={14} />
 <span>{phoneSuccess}</span>
 </div>
 )}

 <div className="text-xs">
 <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Current Verified Mobile</span>
 <strong className="text-slate-800 text-base font-mono font-bold block mt-0.5">{currentUser?.phone}</strong>
 </div>

 {!phoneRequest ? (
 <form onSubmit={handleRequestPhoneChange} className="space-y-3.5">
 <p className="text-slate-500 text-xs leading-relaxed">
 To maintain secure contact points and instant WhatsApp updates, submit a number change for review. Once approved, verify with OTP.
 </p>
 <div className="flex gap-2">
 <div className="relative flex-1">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
 <input
 type="tel"
 placeholder="Enter 10-digit number"
 value={newPhone}
 onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9]/g,'').slice(0, 10))}
 maxLength={10}
 disabled={phoneLoading}
 className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-[#6D28D9] focus:outline-none"
 required
 />
 </div>
 <button
 type="submit"
 disabled={phoneLoading}
 className="bg-[#6D28D9] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer shrink-0"
 >
 {phoneLoading ?'Submitting...' :'Submit'}
 </button>
 </div>
 </form>
 ) : (
 <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5">
 <div className="flex items-center gap-2">
 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
 phoneRequest.status ==='pending'
 ?'bg-amber-50 text-amber-700 border-amber-200'
 : phoneRequest.status ==='approved'
 ?'bg-green-50 text-green-700 border-green-200'
 :'bg-red-50 text-red-700 border-red-200'
 }`}>
 {phoneRequest.status}
 </span>
 <span className="text-xs text-slate-550 font-bold">Mobile Number Update</span>
 </div>

 <div className="text-xs text-slate-600 flex flex-wrap gap-4 items-center">
 <div>
 <span className="text-slate-400 font-bold block uppercase text-[9px]">Current Mobile</span>
 <span className="font-mono font-bold text-slate-700">{phoneRequest.oldPhone}</span>
 </div>
 <div className="text-slate-350 font-light text-base">→</div>
 <div>
 <span className="text-[#6D28D9] font-bold block uppercase text-[9px]">Requested New Mobile</span>
 <span className="font-mono font-bold text-[#6D28D9]">{phoneRequest.newPhone}</span>
 </div>
 </div>

 {phoneRequest.status ==='pending' && (
 <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/50">
 <p className="text-[10px] text-slate-400 italic">
 Awaiting administrator approval.
 </p>
 <button
 type="button"
 onClick={handleResetPhoneRequest}
 disabled={phoneLoading}
 className="bg-white border border-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer w-full text-center"
 >
 Cancel Request
 </button>
 </div>
 )}

 {phoneRequest.status ==='approved' && !otpSent && (
 <div className="space-y-3 pt-2 border-t border-slate-200/50">
 <p className="text-xs font-medium text-slate-600">
 Admin approved! Request an OTP code to verify your new mobile number and complete the update.
 </p>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={handleResetPhoneRequest}
 disabled={phoneLoading}
 className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer text-center"
 >
 Cancel / Reset
 </button>
 <button
 type="button"
 onClick={handleSendPhoneChangeOTP}
 disabled={phoneLoading}
 className="flex-1 bg-[#6D28D9] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-sm text-center"
 >
 Send OTP
 </button>
 </div>
 </div>
 )}

 {phoneRequest.status ==='approved' && otpSent && (
 <form onSubmit={handleVerifyPhoneChangeOTP} className="space-y-3 pt-2 border-t border-slate-200/50">
 <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
 6-Digit OTP Code
 </span>
 <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 font-semibold mb-2">
 Test Helper: OTP is simulated. Enter **123456** to complete verification.
 </p>

 <div className="flex gap-2">
 <input
 type="tel"
 placeholder="Enter 6-digit OTP"
 value={changeOtp}
 onChange={(e) => setChangeOtp(e.target.value.replace(/[^0-9]/g,'').slice(0, 6))}
 maxLength={6}
 disabled={phoneLoading}
 className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 bg-white focus:border-[#6D28D9] focus:outline-none"
 required
 />
 <button
 type="submit"
 disabled={phoneLoading}
 className="bg-[#6D28D9] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer shrink-0"
 >
 Verify OTP
 </button>
 </div>

 <button
 type="button"
 onClick={() => setOtpSent(false)}
 className="text-[10px] text-slate-400 font-bold block mt-1 cursor-pointer"
 >
 Resend OTP Code
 </button>
 </form>
 )}

 {phoneRequest.status ==='rejected' && (
 <div className="space-y-2 pt-2 border-t border-slate-200/50">
 <p className="text-xs text-red-800 bg-red-100/50 p-2.5 rounded border border-red-200 font-semibold">
 Reason: {phoneRequest.rejectionReason ||'No reason provided.'}
 </p>
 <button
 type="button"
 onClick={handleResetPhoneRequest}
 disabled={phoneLoading}
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

export default SecurityPage;
