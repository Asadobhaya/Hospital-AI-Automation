// src/components/Header.jsx — Accessible Clinical App Header
import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Open main menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Live Status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            Live Clinical Engine
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-[11px]">Render Cloud / Supabase RLS</span>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="System notifications"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-400" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div
              className="w-9 h-9 bg-primary-600/25 text-primary-300 border border-primary-500/40 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm"
              aria-hidden="true"
            >
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">
                {user?.name || 'Hospital Admin'}
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
