import { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { useAuth } from'../../contexts/AuthContext';
import { ALL_SKILLS } from'../../utils/locations';
import Navbar from'../../components/Navbar';
import { ChevronLeft, CheckCircle2, AlertCircle } from'lucide-react';

const SkillsPage = () => {
 const navigate = useNavigate();
 const { currentUser, updateProfile, reloadProfile } = useAuth();
 
 const [selectedSkills, setSelectedSkills] = useState([]);
 const [loading, setLoading] = useState(false);
 const [successMsg, setSuccessMsg] = useState('');
 const [errorMsg, setErrorMsg] = useState('');

 useEffect(() => {
 if (currentUser?.skills) {
 const timer = setTimeout(() => {
 setSelectedSkills(currentUser.skills);
 }, 0);
 return () => clearTimeout(timer);
 }
 }, [currentUser]);

 const handleToggleSkill = (skill) => {
 setErrorMsg('');
 setSuccessMsg('');
 if (selectedSkills.includes(skill)) {
 setSelectedSkills(prev => prev.filter(s => s !== skill));
 } else {
 setSelectedSkills(prev => [...prev, skill]);
 }
 };

 const handleSave = async () => {
 if (selectedSkills.length === 0) {
 setErrorMsg('Please select at least one skill.');
 return;
 }

 setLoading(true);
 setErrorMsg('');
 setSuccessMsg('');

 try {
 await updateProfile({ skills: selectedSkills });
 await reloadProfile();
 setSuccessMsg('Skills updated successfully!');
 setTimeout(() => {
 setSuccessMsg('');
 }, 3000);
 } catch (err) {
 console.error("Failed to update skills:", err);
 setErrorMsg('Failed to update skills. Please try again.');
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
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">Manage Skills</h1>
 </div>

 <div className="space-y-6">
 <p className="text-[14px] text-slate-500 leading-relaxed">
 Select the skills that match your expertise. Employers will search and match jobs based on the skills you choose here.
 </p>

 {/* Success and Error Alerts */}
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

 {/* Skills selection card */}
 <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
 <h2 className="font-bold text-slate-800 text-[18px] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
 Select Your Skills
 </h2>

 <div className="flex flex-wrap gap-3">
 {ALL_SKILLS.map((skill) => {
 const isSelected = selectedSkills.includes(skill);
 return (
 <button
 key={skill}
 type="button"
 onClick={() => handleToggleSkill(skill)}
 className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-[14px] font-bold cursor-pointer flex items-center gap-2 ${
 isSelected
 ?'bg-[#6D28D9] border-[#6D28D9] text-white shadow-sm'
 :'bg-slate-50 border-slate-200 text-slate-600'
 }`}
 >
 {isSelected && <CheckCircle2 size={16} className="fill-white/10 text-white" />}
 <span>{skill}</span>
 </button>
 );
 })}
 </div>

 <div className="border-t border-slate-100 pt-5 mt-6">
 <button
 type="button"
 onClick={handleSave}
 disabled={loading}
 className="w-full bg-[#6D28D9] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-[16px] shadow-sm cursor-pointer text-center"
 >
 {loading ?'Saving Changes...' :'Save Changes'}
 </button>
 </div>
 </div>
 </div>
 </main>
 </div>
 </div>
 );
};

export default SkillsPage;
