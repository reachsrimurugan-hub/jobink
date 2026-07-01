import React, { useState, useEffect } from'react';
import Modal from'./Modal';
import { Search, MapPin, Loader2 } from'lucide-react';
import { autocompleteLocations, reverseGeocode } from'../services/geoapify';

const LocationAutocompleteModal = ({ isOpen, onClose, onSelect }) => {
 const [query, setQuery] = useState('');
 const [suggestions, setSuggestions] = useState([]);
 const [loading, setLoading] = useState(false);
 const [gpsLoading, setGpsLoading] = useState(false);

 useEffect(() => {
 if (!isOpen) {
 setQuery('');
 setSuggestions([]);
 return;
 }
 }, [isOpen]);

 useEffect(() => {
 if (!query || query.trim().length < 3) {
 setSuggestions([]);
 return;
 }

 const delayDebounceFn = setTimeout(async () => {
 setLoading(true);
 try {
 const results = await autocompleteLocations(query);
 setSuggestions(results);
 } catch (err) {
 console.error("Autocomplete search error:", err);
 } finally {
 setLoading(false);
 }
 }, 400);

 return () => clearTimeout(delayDebounceFn);
 }, [query]);

 const handleSelect = (location) => {
 onSelect(location);
 onClose();
 };

 const handleUseCurrentLocation = () => {
 if (!navigator.geolocation) {
 alert("Browser does not support geolocation.");
 return;
 }
 setGpsLoading(true);
 navigator.geolocation.getCurrentPosition(
 async (position) => {
 try {
 const lat = position.coords.latitude;
 const lon = position.coords.longitude;
 const location = await reverseGeocode(lat, lon);
 if (location) {
 handleSelect(location);
 } else {
 alert("Failed to find details for your current coordinates.");
 }
 } catch (err) {
 console.error("Reverse geocoding error:", err);
 alert("Error resolving your location address. Please try searching for it instead.");
 } finally {
 setGpsLoading(false);
 }
 },
 (error) => {
 console.error("GPS fetching error:", error);
 alert(error.message ||"Failed to retrieve coordinates. Please search instead.");
 setGpsLoading(false);
 },
 { enableHighAccuracy: true, timeout: 8000 }
 );
 };

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="Search Location">
 <div className="flex flex-col gap-3 text-left py-2 min-h-[300px]">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input
 type="text"
 placeholder="Type area, landmark, city..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:border-primary focus:outline-none"
 autoFocus
 />
 {loading && (
 <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
 )}
 </div>

 {/* Use Current GPS Location Button */}
 <button
 type="button"
 onClick={handleUseCurrentLocation}
 disabled={gpsLoading}
 className="w-full py-3 px-4 bg-primary/5 border border-primary/20 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer touch-target shrink-0 disabled:opacity-50"
 >
 {gpsLoading ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 <span>Locating you...</span>
 </>
 ) : (
 <>
 <MapPin size={14} className="stroke-[2.5]" />
 <span>Use Current Location</span>
 </>
 )}
 </button>

 {/* Suggestions List */}
 <div className="flex-1 overflow-y-auto max-h-[350px] space-y-1 mt-2">
 {query.trim().length >= 3 && suggestions.length === 0 && !loading && (
 <p className="text-xs text-slate-400 text-center py-8 font-medium">No locations found.</p>
 )}

 {query.trim().length < 3 && (
 <p className="text-xs text-slate-400 text-center py-8 font-semibold">Enter at least 3 characters to search.</p>
 )}

 {suggestions.map((loc, idx) => (
 <button
 key={`${loc.latitude}-${loc.longitude}-${idx}`}
 type="button"
 onClick={() => handleSelect(loc)}
 className="w-full text-left p-3.5 border border-transparent rounded-xl flex items-start gap-3 cursor-pointer group"
 >
 <div className="w-8 h-8 rounded-lg bg-rebeccapurple-50 text-rebeccapurple-600 flex items-center justify-center shrink-0 mt-0.5 group- group-">
 <MapPin size={16} />
 </div>
 <div className="flex-1 min-w-0">
 <span className="font-bold text-slate-800 text-xs block group-">
 {loc.locality || loc.city ||'Location'}
 </span>
 <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 truncate leading-relaxed">
 {loc.formattedAddress}
 </span>
 </div>
 </button>
 ))}
 </div>
 </div>
 </Modal>
 );
};

export default LocationAutocompleteModal;
