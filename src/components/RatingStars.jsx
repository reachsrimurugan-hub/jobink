import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, maxStars = 5, size = 16, interactive = false, onChange }) => {
  const starsArray = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-0.5">
      {starsArray.map((starVal) => {
        const isFilled = interactive 
          ? rating >= starVal 
          : rating >= starVal - 0.25; // Simple rounding for half stars
        
        const isHalf = !interactive && rating >= starVal - 0.75 && rating < starVal - 0.25;

        return (
          <button
            key={starVal}
            type="button"
            disabled={!interactive}
            onClick={() => onChange && onChange(starVal)}
            className={`transition-transform duration-100 ${
              interactive ? 'cursor-pointer hover:scale-110 active:scale-95 touch-target flex items-center justify-center' : 'cursor-default'
            }`}
            style={{ width: interactive ? size + 16 : size, height: interactive ? size + 16 : size }}
            aria-label={interactive ? `Rate ${starVal} out of ${maxStars} stars` : `${starVal} Star`}
          >
            <Star
              size={size}
              className={`${
                isFilled 
                  ? 'fill-amber-400 text-amber-400' 
                  : isHalf 
                    ? 'fill-amber-400/50 text-amber-400' 
                    : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
      {!interactive && rating > 0 && (
        <span className="text-xs font-semibold text-slate-600 ml-1.5">{rating}</span>
      )}
    </div>
  );
};

export default RatingStars;
