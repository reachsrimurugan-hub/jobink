import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ProfileMenuItem = ({ icon: Icon, title, subtitle, to, onClick }) => {
  const content = (
    <div className="flex items-center justify-between w-full min-h-[56px] py-3.5 px-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-left cursor-pointer active:bg-slate-50">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-black flex items-center justify-center shrink-0">
            <Icon size={20} className="stroke-[2.25]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="font-bold text-slate-800 text-[17px] block leading-tight">
            {title}
          </span>
          {subtitle && (
            <span className="text-[14px] text-slate-400 font-medium block mt-0.5 leading-normal">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-400 shrink-0" />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block w-full focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/25 rounded-2xl">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/25 rounded-2xl text-left"
    >
      {content}
    </button>
  );
};

export default memo(ProfileMenuItem);
