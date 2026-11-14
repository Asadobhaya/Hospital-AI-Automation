// src/components/Header.jsx — Clean Medical Blue & White Header
import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#DFE6EE] px-4 sm:px-6 py-2.5 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#4B5D6B] hover:text-[#172B3A] rounded-lg hover:bg-[#EDF4FB] min-h-[40px] min-w-[40px] flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-[#175DB5]"
          aria-label="Open main menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Live Status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#617181]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18794E] animate-pulse" aria-hidden="true" />
            Live Clinical Engine
          </span>
          <span className="text-[#DFE6EE]">•</span>
          <span className="text-[#617181] text-[11px]">Render Cloud / Supabase RLS</span>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-[#617181] hover:text-[#172B3A] rounded-lg hover:bg-[#EDF4FB] relative transition min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#175DB5]"
            aria-label="System notifications"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2F78C8]" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[#DFE6EE]">
            <div
              className="w-8 h-8 bg-[#E7F1FB] text-[#173A5E] border border-[#2F78C8]/25 rounded-lg flex items-center justify-center text-xs font-bold shadow-2xs"
              aria-hidden="true"
            >
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#172B3A] leading-tight">
                {user?.name || 'Hospital Admin'}
              </p>
              <p className="text-[11px] text-[#617181] leading-tight capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
