import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';

const NotificationCard = ({ notification, onMarkRead }) => {
  const { id, title, message, read, createdAt } = notification;

  // Simple date format helper
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`p-4 border border-slate-200 rounded-xl transition-all ${
      read ? 'bg-white' : 'bg-blue-50/50 border-blue-100 shadow-sm'
    } flex items-start justify-between gap-3 text-left`}>
      
      <div className="flex gap-3">
        {/* Left icon status */}
        <div className={`mt-0.5 p-1.5 rounded-lg flex items-center justify-center shrink-0 ${
          read ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'
        }`}>
          <Bell size={16} />
        </div>

        {/* Content details */}
        <div>
          <div className="flex items-center gap-2">
            <h5 className={`text-slate-800 text-sm ${read ? 'font-medium' : 'font-bold'}`}>{title}</h5>
            {!read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">{formatTime(createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      {!read && onMarkRead && (
        <button
          type="button"
          onClick={() => onMarkRead(id)}
          className="text-primary hover:text-primary-dark p-1.5 hover:bg-white rounded-lg border border-slate-200/60 shadow-sm transition-all shrink-0 touch-target flex items-center justify-center"
          title="Mark read"
          aria-label="Mark read"
        >
          <Check size={14} className="stroke-[3]" />
        </button>
      )}
    </div>
  );
};

export default React.memo(NotificationCard);
