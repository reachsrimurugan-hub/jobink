import { useState } from'react';
import { useNavigate } from'react-router-dom';
import { useTranslation } from'react-i18next';
import { useAuth } from'../../contexts/AuthContext';
import Navbar from'../../components/Navbar';
import { ChevronLeft, Check, Globe } from'lucide-react';

const LanguagePage = () => {
 const navigate = useNavigate();
 const { i18n } = useTranslation();
 const { currentUser, updateProfile, startTransition, endTransition } = useAuth();
 
 const currentLang = i18n.language ? i18n.language.split('-')[0] :'en';
 const [successMsg, setSuccessMsg] = useState('');

 if (!currentUser) {
   return null;
 }

 const languages = [
 { code:'en', label:'English', nativeLabel:'English' },
 { code:'ta', label:'Tamil', nativeLabel:'தமிழ்' },
 { code:'hi', label:'Hindi', nativeLabel:'हिन्दी' }
 ];

 const handleSelectLanguage = async (langCode) => {
 if (langCode === currentLang) return;
 
 setSuccessMsg('');
 try {
 startTransition();
 await i18n.changeLanguage(langCode);
 localStorage.setItem('i18nextLng', langCode);
 
 if (currentUser) {
 await updateProfile({ language: langCode });
 }

 setSuccessMsg('Language preference updated successfully!');
 setTimeout(() => {
 setSuccessMsg('');
 }, 2500);
 } catch (err) {
 console.error('Failed to change language:', err);
 } finally {
 setTimeout(() => {
 endTransition();
 }, 500);
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
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Preferred Language</h1>
 </div>

 <div className="space-y-6">
 <p className="text-[14px] text-slate-500 leading-relaxed">
 Choose your preferred language for the application interface and notifications.
 </p>

 {successMsg && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-4 rounded-xl shadow-sm flex items-center gap-2">
 <Check size={16} />
 <span>{successMsg}</span>
 </div>
 )}

 {/* Language Options List */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3.5">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
 <Globe size={18} className="text-[#6D28D9]" />
 Select Language
 </h2>

 <div className="flex flex-col gap-3.5">
 {languages.map((lang) => {
 const isSelected = lang.code === currentLang;
 return (
 <button
 key={lang.code}
 type="button"
 onClick={() => handleSelectLanguage(lang.code)}
 className={`flex items-center justify-between w-full min-h-[56px] p-4 bg-white border rounded-xl text-left cursor-pointer group ${
 isSelected
 ?'border-[#6D28D9] bg-[#6D28D9]/5 ring-1 ring-[#6D28D9]/10'
 :'border-slate-200'
 }`}
 >
 <div className="flex flex-col">
 <span className={`text-[17px] font-bold ${isSelected ?'text-[#6D28D9]' :'text-slate-800'}`}>
 {lang.nativeLabel}
 </span>
 <span className="text-[14px] text-slate-400 font-medium">
 {lang.label}
 </span>
 </div>

 {isSelected && (
 <div className="w-6 h-6 rounded-full bg-[#6D28D9] flex items-center justify-center text-white shrink-0">
 <Check size={14} className="stroke-[3]" />
 </div>
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 </main>
 </div>
 </div>
 );
};

export default LanguagePage;
