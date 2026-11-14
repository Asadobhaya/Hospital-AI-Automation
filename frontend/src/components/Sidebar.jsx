// src/components/Sidebar.jsx — Deep Navy Professional Clinical Navigation
import React, { useEffect } from 'react';
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

  // Close on Escape key in mobile drawer view
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#172B3A]/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Deep Navy Navigation Drawer */}
      <aside
        aria-label="Sidebar Navigation"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#173A5E] text-white 
          flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-md
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Banner */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#234A74]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2F78C8] rounded-lg flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                MediPulse <span className="text-[#A7CEF0] font-semibold">AI</span>
              </span>
              <p className="text-[11px] text-[#A3BFD9] leading-tight">Clinical Operations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-[#A3BFD9] hover:text-white rounded-lg hover:bg-[#204975] transition focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition min-h-[40px] ${
                    isActive
                      ? 'bg-[#244C78] text-white border-l-4 border-[#2F78C8] shadow-xs'
                      : 'text-[#CBD5E1] hover:text-white hover:bg-[#1E4976]/60 border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-[#A7CEF0]" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Sign Out */}
        <div className="p-3 border-t border-[#234A74]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-[#CBD5E1] hover:text-[#FCA5A5] hover:bg-[#831810]/20 rounded-lg transition cursor-pointer min-h-[40px] focus-visible:ring-2 focus-visible:ring-[#FCA5A5]"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
