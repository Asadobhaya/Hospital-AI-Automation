import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  MessageSquare,
  Phone,
  FileText,
  Star,
  Settings,
  LogOut,
  X,
  Activity,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/calls', icon: Phone, label: 'Voice Calls' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/feedback', icon: Star, label: 'Feedback' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 
          flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">
                MediPulse <span className="text-primary-400 font-medium">AI</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-none">Clinical Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-400 border border-primary-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
