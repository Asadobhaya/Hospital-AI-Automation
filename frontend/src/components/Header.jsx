// src/components/Header.jsx — Clean Medical Blue & White Header with Real Notifications & Branded Admin Profile
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  CheckCheck,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  PhoneCall,
  X,
  ChevronRight,
  LogOut,
  Settings,
  User,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Load real operational notifications from API
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await dashboardAPI.getNotifications();
      setNotifications(res?.data || res || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s live polling
    return () => clearInterval(interval);
  }, []);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (link, notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    if (link) {
      navigate(link);
    }
  };

  const formatRelativeTime = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'urgent':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#B42318] border border-[#B42318]/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'critical':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#B42318] border border-[#B42318]/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
      case 'booking':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E7F1FB] text-[#2F78C8] border border-[#2F78C8]/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FFF2D8] text-[#8A4B08] border border-[#8A4B08]/20 flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        );
    }
  };

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18794E] animate-pulse" aria-hidden="true" />
            Live Clinical Engine
          </span>
          <span className="text-[#DFE6EE]">•</span>
          <span className="text-[#617181] text-[11px]">Render Cloud / Supabase RLS</span>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3">
          {/* Notification Bell with Dropdown Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className={`p-2 rounded-lg relative transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#175DB5] ${
                showNotifications
                  ? 'bg-[#E7F1FB] text-[#2F78C8]'
                  : 'text-[#617181] hover:text-[#172B3A] hover:bg-[#EDF4FB]'
              }`}
              aria-label="System notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold text-white bg-[#B42318] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#DFE6EE] overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-3.5 border-b border-[#DFE6EE] bg-[#F5F8FC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#172B3A]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#E7F1FB] text-[#2F78C8] border border-[#2F78C8]/20 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#2F78C8] hover:text-[#173A5E] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-[#DFE6EE]">
                  {loadingNotifications && notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#617181]">
                      <div className="w-6 h-6 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8898AA]">
                      No active notifications. System operations normal.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.link, notif.id)}
                        className={`p-3.5 hover:bg-[#EDF4FB] transition cursor-pointer flex items-start gap-3 ${
                          !notif.read ? 'bg-[#F5F8FC]/60' : 'bg-white'
                        }`}
                      >
                        {getNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-[#172B3A] truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-[#8898AA] shrink-0">
                              {formatRelativeTime(notif.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-[#4B5D6B] mt-0.5 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#2F78C8] shrink-0 mt-1" aria-hidden="true" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-[#F5F8FC] border-t border-[#DFE6EE] text-center">
                  <Link
                    to="/settings"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#2F78C8] hover:text-[#173A5E] font-semibold flex items-center justify-center gap-1"
                  >
                    <span>View System Audit Logs</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile with Hospital Cross Logo Emblem */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 pl-3 border-l border-[#DFE6EE] hover:opacity-90 transition cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-[#175DB5] rounded-lg"
              aria-label="User profile menu"
              aria-expanded={showProfileMenu}
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#2F78C8]/30 shadow-xs bg-white flex items-center justify-center p-0.5 shrink-0">
                <img
                  src="/logo.png"
                  alt="MediPulse Hospital Admin Emblem"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#172B3A] leading-tight">
                  {user?.name || 'Hospital Admin'}
                </p>
                <p className="text-[11px] text-[#617181] leading-tight capitalize">
                  {user?.role || 'admin'}
                </p>
              </div>
            </button>

            {/* Admin Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DFE6EE] overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-3.5 bg-[#F5F8FC] border-b border-[#DFE6EE] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#2F78C8]/30 shadow-xs bg-white flex items-center justify-center p-0.5 shrink-0">
                    <img
                      src="/logo.png"
                      alt="Admin Logo Emblem"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#172B3A] truncate">
                      {user?.name || 'Hospital Admin'}
                    </p>
                    <p className="text-[11px] text-[#617181] font-mono truncate">
                      {user?.email || 'admin@hospital.test'}
                    </p>
                  </div>
                </div>

                <div className="p-2 space-y-1 text-xs">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#4B5D6B] hover:text-[#172B3A] hover:bg-[#EDF4FB] rounded-xl transition font-medium"
                  >
                    <Settings className="w-4 h-4 text-[#2F78C8]" aria-hidden="true" />
                    <span>System Settings & Telemetry</span>
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#4B5D6B] hover:text-[#172B3A] hover:bg-[#EDF4FB] rounded-xl transition font-medium"
                  >
                    <Activity className="w-4 h-4 text-[#18794E]" aria-hidden="true" />
                    <span>Clinical AI Safety Hub</span>
                  </Link>
                </div>

                <div className="p-2 border-t border-[#DFE6EE] bg-[#F5F8FC]/50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[#B42318] hover:bg-[#FDECEC] rounded-xl transition font-semibold text-xs cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out of Dashboard</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
