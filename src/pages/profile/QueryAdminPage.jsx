import { useState } from'react';
import { useNavigate } from'react-router-dom';
import { useAuth } from'../../contexts/AuthContext';
import { queryService } from'../../services/db';
import Navbar from'../../components/Navbar';
import { ChevronLeft, MessageSquare, Paperclip, Send, CheckCircle2, AlertCircle, X } from'lucide-react';

const QueryAdminPage = () => {
 const navigate = useNavigate();
 const { currentUser } = useAuth();

 const [subject, setSubject] = useState('');
 const [message, setMessage] = useState('');
 const [attachmentName, setAttachmentName] = useState('');
 const [attachmentBase64, setAttachmentBase64] = useState('');
 
 const [loading, setLoading] = useState(false);
 const [successMsg, setSuccessMsg] = useState('');
 const [errorMsg, setErrorMsg] = useState('');

 const handleFileChange = (e) => {
 const file = e.target.files[0];
 if (!file) return;

 // Limit file size to 2MB to keep Firestore document safe
 if (file.size > 2 * 1024 * 1024) {
 setErrorMsg('Attachment file size must be less than 2MB.');
 return;
 }

 setAttachmentName(file.name);
 setErrorMsg('');

 const reader = new FileReader();
 reader.onload = (event) => {
 setAttachmentBase64(event.target.result);
 };
 reader.onerror = () => {
 setErrorMsg('Failed to read attachment file.');
 };
 reader.readAsDataURL(file);
 };

 const handleClearAttachment = () => {
 setAttachmentName('');
 setAttachmentBase64('');
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!subject.trim()) {
 setErrorMsg('Please enter a query subject.');
 return;
 }
 if (!message.trim()) {
 setErrorMsg('Please enter a query message.');
 return;
 }

 setLoading(true);
 setErrorMsg('');
 setSuccessMsg('');

 // Combine Subject, Message, and Attachment into queryText for the backend
 let queryText = `Subject: ${subject.trim()}\n\nMessage: ${message.trim()}`;
 if (attachmentBase64) {
 queryText += `\n\n[Attachment: ${attachmentName}]\n${attachmentBase64}`;
 }

 try {
 await queryService.submitQuery(
 currentUser.uid,
 currentUser.name ||'User',
 currentUser.phone ||'',
 currentUser.role,
 queryText
 );

 setSuccessMsg('Your message has been sent to the Admin!');
 setSubject('');
 setMessage('');
 setAttachmentName('');
 setAttachmentBase64('');

 // Auto redirect after success
 setTimeout(() => {
 navigate(-1);
 }, 2500);
 } catch (err) {
 console.error("Failed to submit query:", err);
 setErrorMsg('Failed to send message. Please try again.');
 } finally {
 setLoading(false);
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
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Message Admin</h1>
 </div>

 <div className="space-y-6">
 <p className="text-[14px] text-slate-500 leading-relaxed">
 Have questions, issues with verification, or payment disputes? Submit a ticket directly to our administrator team.
 </p>

 {/* Alerts */}
 {successMsg && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-4 rounded-xl shadow-sm flex items-center gap-2">
 <CheckCircle2 size={16} />
 <span>{successMsg}</span>
 </div>
 )}
 {errorMsg && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-xl shadow-sm flex items-center gap-2">
 <AlertCircle size={16} />
 <span>{errorMsg}</span>
 </div>
 )}

 {/* Form Card */}
 <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-4">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
 <MessageSquare size={18} className="text-[#6D28D9]" />
 New Ticket details
 </h2>

 {/* Subject */}
 <div>
 <label htmlFor="subject" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
 Subject / Topic
 </label>
 <input
 id="subject"
 type="text"
 placeholder="e.g. Identity Verification Delay, Payment Issue"
 value={subject}
 onChange={(e) => setSubject(e.target.value)}
 disabled={loading}
 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#6D28D9] focus:outline-none bg-slate-50/50 focus:bg-white"
 required
 />
 </div>

 {/* Message */}
 <div>
 <label htmlFor="message" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
 Your Message
 </label>
 <textarea
 id="message"
 rows={6}
 placeholder="Describe your query or issue in detail..."
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 disabled={loading}
 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#6D28D9] focus:outline-none bg-slate-50/50 focus:bg-white leading-relaxed"
 required
 />
 </div>

 {/* Attachment upload */}
 <div>
 <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
 Attachment (Optional)
 </span>
 
 {attachmentName ? (
 <div className="flex items-center justify-between border border-[#6D28D9]/20 bg-[#6D28D9]/5 px-4 py-3 rounded-xl">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-700 truncate">
 <Paperclip size={14} className="text-[#6D28D9]" />
 <span className="truncate">{attachmentName}</span>
 </div>
 <button
 type="button"
 onClick={handleClearAttachment}
 className="p-1 rounded-full bg-slate-100 text-slate-500"
 title="Clear file"
 >
 <X size={14} />
 </button>
 </div>
 ) : (
 <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-4 rounded-xl cursor-pointer">
 <Paperclip size={16} className="text-slate-400" />
 <span className="text-xs font-bold text-slate-500">Upload screenshot or document</span>
 <input
 type="file"
 accept="image/*,application/pdf"
 onChange={handleFileChange}
 className="hidden"
 />
 </label>
 )}
 <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">Max size: 2MB (Images, PDFs)</span>
 </div>

 <div className="border-t border-slate-100 pt-5 mt-6">
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-[#6D28D9] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-[16px] shadow-sm cursor-pointer flex items-center justify-center gap-2"
 >
 <Send size={16} />
 {loading ?'Sending Message...' :'Submit Query'}
 </button>
 </div>
 </form>
 </div>
 </main>
 </div>
 </div>
 );
};

export default QueryAdminPage;
