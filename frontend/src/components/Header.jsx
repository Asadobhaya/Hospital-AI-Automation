import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden lg:block text-xs font-medium text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Cloud System
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 bg-primary-600/20 text-primary-400 border border-primary-500/30 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
