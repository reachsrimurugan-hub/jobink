import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { autocompleteLocations } from '../services/geoapify';

const LocationAutocompleteModal = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Location">
      <div className="flex flex-col gap-4 text-left py-2 min-h-[300px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Type area, landmark, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:border-primary focus:outline-none transition-all"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
          )}
        </div>

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
              className="w-full text-left p-3.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-rebeccapurple-50 text-rebeccapurple-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <MapPin size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 text-xs block group-hover:text-primary transition-colors">
                  {loc.locality || loc.city || 'Location'}
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
