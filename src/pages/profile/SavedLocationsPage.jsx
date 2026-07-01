import { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { useAuth } from'../../contexts/AuthContext';
import { reverseGeocode, autocompleteLocations } from'../../services/geoapify';
import Navbar from'../../components/Navbar';
import { ChevronLeft, MapPin, Navigation, Home, Briefcase, Trash2, Search, Loader2, Check } from'lucide-react';

const SavedLocationsPage = () => {
 const navigate = useNavigate();
 const { currentUser, updateProfile, reloadProfile } = useAuth();

 const [searchQuery, setSearchQuery] = useState('');
 const [suggestions, setSuggestions] = useState([]);
 const [searching, setSearching] = useState(false);
 const [selectedLoc, setSelectedLoc] = useState(null);
 
 const [detecting, setDetecting] = useState(false);
 const [actionLoading, setActionLoading] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');
 const [successMsg, setSuccessMsg] = useState('');

 const isEmployer = currentUser?.role ==='employer';

 // Debounce autocomplete search query
 useEffect(() => {
 if (!searchQuery || searchQuery.trim().length < 3) {
 const timer = setTimeout(() => {
 setSuggestions([]);
 }, 0);
 return () => clearTimeout(timer);
 }

 const delayDebounceFn = setTimeout(async () => {
 setSearching(true);
 setErrorMsg('');
 try {
 const results = await autocompleteLocations(searchQuery);
 setSuggestions(results);
 } catch (err) {
 console.error("Autocomplete search error:", err);
 setErrorMsg('Failed to search locations.');
 } finally {
 setSearching(false);
 }
 }, 400);

 return () => clearTimeout(delayDebounceFn);
 }, [searchQuery]);

 const handleSelectSuggestion = (loc) => {
 setSelectedLoc(loc);
 setSearchQuery('');
 setSuggestions([]);
 };

 const handleAutoDetect = () => {
 if (!navigator.geolocation) {
 setErrorMsg('Your browser does not support geolocation.');
 return;
 }

 setDetecting(true);
 setErrorMsg('');
 setSuccessMsg('');

 navigator.geolocation.getCurrentPosition(
 async (position) => {
 const { latitude, longitude } = position.coords;
 try {
 const result = await reverseGeocode(latitude, longitude);
 if (result) {
 setSelectedLoc(result);
 setSuccessMsg('Successfully detected current coordinates.');
 } else {
 setErrorMsg('Could not resolve address for your coordinates.');
 }
 } catch (err) {
 console.error("Auto detect error:", err);
 setErrorMsg('Failed to resolve coordinates. Please search manually.');
 } finally {
 setDetecting(false);
 }
 },
 (error) => {
 console.warn("Geolocation permission error:", error.message);
 setErrorMsg('Location permission denied or unavailable.');
 setDetecting(false);
 },
 { enableHighAccuracy: true, timeout: 10000 }
 );
 };

 const handleUpdatePrimary = async (locToSave) => {
 if (!locToSave) return;
 setActionLoading(true);
 setErrorMsg('');
 setSuccessMsg('');
 try {
 await updateProfile({
 location: locToSave.formattedAddress || `${locToSave.locality}, ${locToSave.city}`,
 locality: locToSave.locality ||'',
 city: locToSave.city ||'',
 formattedAddress: locToSave.formattedAddress ||'',
 locationCoordinates: {
 latitude: locToSave.latitude,
 longitude: locToSave.longitude
 },
 locationUpdatedAt: new Date().toISOString()
 });
 await reloadProfile();
 setSuccessMsg('Primary location updated successfully!');
 setSelectedLoc(null);
 } catch (err) {
 console.error(err);
 setErrorMsg('Failed to update primary location.');
 } finally {
 setActionLoading(false);
 }
 };

 const handleSetHome = async (locToSave) => {
 if (!locToSave) return;
 setActionLoading(true);
 setErrorMsg('');
 setSuccessMsg('');
 try {
 await updateProfile({
 homeLocation: {
 location: locToSave.formattedAddress || `${locToSave.locality}, ${locToSave.city}`,
 locality: locToSave.locality ||'',
 city: locToSave.city ||'',
 formattedAddress: locToSave.formattedAddress ||'',
 locationCoordinates: {
 latitude: locToSave.latitude,
 longitude: locToSave.longitude
 }
 }
 });
 await reloadProfile();
 setSuccessMsg(isEmployer ?'Primary Business location saved!' :'Home location saved!');
 setSelectedLoc(null);
 } catch (err) {
 console.error(err);
 setErrorMsg('Failed to save home/business location.');
 } finally {
 setActionLoading(false);
 }
 };

 const handleSetWork = async (locToSave) => {
 if (!locToSave) return;
 setActionLoading(true);
 setErrorMsg('');
 setSuccessMsg('');
 try {
 await updateProfile({
 workLocation: {
 location: locToSave.formattedAddress || `${locToSave.locality}, ${locToSave.city}`,
 locality: locToSave.locality ||'',
 city: locToSave.city ||'',
 formattedAddress: locToSave.formattedAddress ||'',
 locationCoordinates: {
 latitude: locToSave.latitude,
 longitude: locToSave.longitude
 }
 }
 });
 await reloadProfile();
 setSuccessMsg(isEmployer ?'Branch/Secondary Business location saved!' :'Work location saved!');
 setSelectedLoc(null);
 } catch (err) {
 console.error(err);
 setErrorMsg('Failed to save work/business location.');
 } finally {
 setActionLoading(false);
 }
 };

 const handleDeleteLocation = async (type) => {
 setActionLoading(true);
 setErrorMsg('');
 setSuccessMsg('');
 try {
 const updates = {};
 if (type ==='home') {
 updates.homeLocation = null;
 } else if (type ==='work') {
 updates.workLocation = null;
 }
 await updateProfile(updates);
 await reloadProfile();
 setSuccessMsg('Location deleted successfully.');
 } catch (err) {
 console.error(err);
 setErrorMsg('Failed to delete location.');
 } finally {
 setActionLoading(false);
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
 <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">
 {isEmployer ?'Business Locations' :'Saved Locations'}
 </h1>
 </div>

 <div className="space-y-6">
 {/* Success and Error Alerts */}
 {successMsg && (
 <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-4 rounded-xl shadow-sm flex items-center gap-2">
 <Check size={16} />
 <span>{successMsg}</span>
 </div>
 )}
 {errorMsg && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-xl shadow-sm">
 {errorMsg}
 </div>
 )}

 {/* 1. Add New Location Autocomplete Search */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
 <h2 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
 <Search size={18} className="text-[#6D28D9]" />
 Add New Location
 </h2>

 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input
 type="text"
 placeholder="Search landmark, neighborhood, city..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#6D28D9] focus:outline-none bg-slate-50/50 focus:bg-white"
 />
 {searching && (
 <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D28D9] animate-spin" size={18} />
 )}
 </div>

 {/* Autocomplete Suggestions */}
 {suggestions.length > 0 && (
 <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white shadow-md max-h-[250px] overflow-y-auto">
 {suggestions.map((loc, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => handleSelectSuggestion(loc)}
 className="w-full text-left p-3 text-xs flex items-start gap-2.5 cursor-pointer"
 >
 <MapPin size={14} className="text-slate-400 mt-0.5" />
 <div>
 <span className="font-bold text-slate-800 block">{loc.locality || loc.city}</span>
 <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-md">{loc.formattedAddress}</span>
 </div>
 </button>
 ))}
 </div>
 )}

 {/* Selection Actions Panel */}
 {selectedLoc && (
 <div className="bg-[#6D28D9]/5 border border-[#6D28D9]/10 rounded-xl p-4 space-y-3.5">
 <div className="text-xs">
 <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Address</span>
 <strong className="text-slate-800 font-bold block mt-0.5 leading-snug">{selectedLoc.formattedAddress}</strong>
 </div>

 <div className="flex gap-2 flex-wrap">
 <button
 type="button"
 onClick={() => handleUpdatePrimary(selectedLoc)}
 disabled={actionLoading}
 className="flex-1 bg-[#6D28D9] text-white text-[12px] font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer"
 >
 Set Current
 </button>
 <button
 type="button"
 onClick={() => handleSetHome(selectedLoc)}
 disabled={actionLoading}
 className="flex-1 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer"
 >
 {isEmployer ?'Set Main Business' :'Set Home'}
 </button>
 <button
 type="button"
 onClick={() => handleSetWork(selectedLoc)}
 disabled={actionLoading}
 className="flex-1 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer"
 >
 {isEmployer ?'Set Branch Business' :'Set Work'}
 </button>
 </div>
 </div>
 )}
 </div>

 {/* 2. Current Location Card */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
 <Navigation size={18} className="text-[#6D28D9]" />
 Current Location
 </h2>
 <button
 type="button"
 onClick={handleAutoDetect}
 disabled={detecting}
 className="text-xs font-bold text-[#6D28D9] cursor-pointer flex items-center gap-1.5"
 >
 {detecting ? (
 <>
 <Loader2 size={12} className="animate-spin" /> Detecting...
 </>
 ) : (
'Auto-detect GPS'
 )}
 </button>
 </div>

 <div className="border border-slate-100 p-4 rounded-xl flex gap-3 text-left">
 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <Navigation size={18} />
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active matching location</span>
 <strong className="text-[17px] text-slate-800 font-bold block mt-0.5 leading-snug">
 {currentUser?.locality || currentUser?.city ||'No Location Saved'}
 </strong>
 <span className="text-[14px] text-slate-500 font-medium block mt-0.5 leading-relaxed">
 {currentUser?.formattedAddress || currentUser?.location ||'Not Specified'}
 </span>
 </div>
 </div>
 </div>

 {/* 3. Saved Locations List */}
 <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
 <h2 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
 <Home size={18} className="text-[#6D28D9]" />
 Saved Entries
 </h2>

 <div className="space-y-4">
 {/* Home Location entry */}
 <div className="border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-3 text-left">
 <div className="flex gap-3 flex-1 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-[#6D28D9]/10 text-[#6D28D9] flex items-center justify-center shrink-0">
 <Home size={18} />
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
 {isEmployer ?'Main Business Location' :'Home Location'}
 </span>
 {currentUser?.homeLocation ? (
 <>
 <strong className="text-[17px] text-slate-800 font-bold block mt-0.5 leading-snug">
 {currentUser.homeLocation.locality || currentUser.homeLocation.city}
 </strong>
 <span className="text-[14px] text-slate-500 font-medium block mt-0.5 leading-normal truncate">
 {currentUser.homeLocation.formattedAddress || currentUser.homeLocation.location}
 </span>
 </>
 ) : (
 <span className="text-[14px] text-slate-400 font-medium block mt-0.5 italic">Not set</span>
 )}
 </div>
 </div>

 {currentUser?.homeLocation && (
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => handleUpdatePrimary(currentUser.homeLocation)}
 disabled={actionLoading}
 title="Use this location now"
 className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl cursor-pointer"
 >
 <Check size={16} />
 </button>
 <button
 type="button"
 onClick={() => handleDeleteLocation('home')}
 disabled={actionLoading}
 title="Delete location"
 className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl cursor-pointer"
 >
 <Trash2 size={16} />
 </button>
 </div>
 )}
 </div>

 {/* Work Location entry */}
 <div className="border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-3 text-left">
 <div className="flex gap-3 flex-1 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-[#6D28D9]/10 text-[#6D28D9] flex items-center justify-center shrink-0">
 <Briefcase size={18} />
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
 {isEmployer ?'Secondary Business Location' :'Work Location'}
 </span>
 {currentUser?.workLocation ? (
 <>
 <strong className="text-[17px] text-slate-800 font-bold block mt-0.5 leading-snug">
 {currentUser.workLocation.locality || currentUser.workLocation.city}
 </strong>
 <span className="text-[14px] text-slate-500 font-medium block mt-0.5 leading-normal truncate">
 {currentUser.workLocation.formattedAddress || currentUser.workLocation.location}
 </span>
 </>
 ) : (
 <span className="text-[14px] text-slate-400 font-medium block mt-0.5 italic">Not set</span>
 )}
 </div>
 </div>

 {currentUser?.workLocation && (
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => handleUpdatePrimary(currentUser.workLocation)}
 disabled={actionLoading}
 title="Use this location now"
 className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl cursor-pointer"
 >
 <Check size={16} />
 </button>
 <button
 type="button"
 onClick={() => handleDeleteLocation('work')}
 disabled={actionLoading}
 title="Delete location"
 className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl cursor-pointer"
 >
 <Trash2 size={16} />
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </main>
 </div>
 </div>
 );
};

export default SavedLocationsPage;
