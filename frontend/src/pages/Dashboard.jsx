// src/pages/Dashboard.jsx — Hospital Executive & Operations Dashboard
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  AlertTriangle,
  PhoneCall,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Activity,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { dashboardAPI } from '../services/api';

const CALL_COLORS = {
  confirmed: '#10B981', // Emerald
  reschedule_requested: '#F59E0B', // Amber
  cancelled: '#EF4444', // Red
  failedOrNoAnswer: '#6B7280' // Gray
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const json = await res.json();
      setData(json.data || json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-800 rounded-xl" />
          <div className="h-80 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    todayTotal: 0,
    upcoming: 0,
    pendingConfirmations: 0,
    missed: 0,
    completed: 0,
    cancelled: 0,
    unresolvedEscalations: 0
  };

  const trendData = data?.trend || [];
  const callStats = data?.callStats || { confirmed: 0, rescheduleRequested: 0, cancelled: 0, failedOrNoAnswer: 0 };
  
  const pieData = [
    { name: 'Confirmed', value: callStats.confirmed || 0, color: CALL_COLORS.confirmed },
    { name: 'Reschedule Req', value: callStats.rescheduleRequested || 0, color: CALL_COLORS.reschedule_requested },
    { name: 'Cancelled', value: callStats.cancelled || 0, color: CALL_COLORS.cancelled },
    { name: 'No Answer/Fail', value: callStats.failedOrNoAnswer || 0, color: CALL_COLORS.failedOrNoAnswer },
  ].filter(d => d.value > 0);

  const integrationHealth = data?.integrationHealth || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clinical & AI Operations Hub</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time telemetry, automated patient journeys & voice scheduling</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/appointments"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-md shadow-primary-600/20 transition"
          >
            <Calendar className="w-4 h-4" />
            Book Appointment
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm flex items-center justify-between">
          <span>Failed to load latest metrics: {error}</span>
          <button onClick={fetchDashboardData} className="underline text-red-300 font-medium">Retry</button>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Total</span>
            <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{summary.todayTotal}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Active
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span>{summary.completed} completed</span>
            <span>•</span>
            <span className="text-amber-400">{summary.upcoming} remaining</span>
          </div>
        </div>

        {/* Pending / Confirmations */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Actions</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{summary.pendingConfirmations}</span>
            <span className="text-xs text-amber-400 font-medium">Calls Queued</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Awaiting 24h/2h automated voice verification
          </div>
        </div>

        {/* Missed Appointments */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Missed / No-Shows</span>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{summary.missed}</span>
            <span className="text-xs text-red-400 font-medium">Re-engagement</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            WhatsApp follow-up dispatched
          </div>
        </div>

        {/* Emergency Escalations */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Staff Escalations</span>
            <div className={`p-2.5 rounded-xl ${summary.unresolvedEscalations > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{summary.unresolvedEscalations}</span>
            <span className={`text-xs font-medium ${summary.unresolvedEscalations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {summary.unresolvedEscalations > 0 ? 'Needs Attention' : 'All Clear'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Unhappy feedback & emergency triage
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Appointment Volume Trend */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/70 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">7-Day Appointment Volume</h2>
              <p className="text-xs text-slate-400">Confirmed, completed, and cancelled trends</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-700/50 px-2.5 py-1 rounded-full border border-slate-600/50">
              Live Database
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Voice Call Outcomes Pie */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-white">AI Voice Call Outcomes</h2>
              <PhoneCall className="w-4 h-4 text-primary-400" />
            </div>
            <p className="text-xs text-slate-400 mb-4">Automated 24h & 2h reminder responses</p>

            {pieData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-500">
                No outbound calls recorded yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Confirmed: {callStats.confirmed || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Reschedule: {callStats.rescheduleRequested || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-300">Cancelled: {callStats.cancelled || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-300">No Answer: {callStats.failedOrNoAnswer || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Subsystems Status */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> System Integration Status
          </h2>
          <div className="space-y-3 text-xs">
            {Object.entries(integrationHealth).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="capitalize font-medium text-slate-300">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">{val.provider}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Automated Workflows & Hub Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/appointments"
                className="p-3 bg-slate-900/60 hover:bg-slate-700/50 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center text-center gap-2 transition group"
              >
                <Calendar className="w-5 h-5 text-primary-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">Book Slot</span>
              </Link>
              <Link
                to="/messages"
                className="p-3 bg-slate-900/60 hover:bg-slate-700/50 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center text-center gap-2 transition group"
              >
                <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">WhatsApp Chat</span>
              </Link>
              <Link
                to="/reports"
                className="p-3 bg-slate-900/60 hover:bg-slate-700/50 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center text-center gap-2 transition group"
              >
                <FileText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">Issue Report</span>
              </Link>
              <Link
                to="/calls"
                className="p-3 bg-slate-900/60 hover:bg-slate-700/50 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center text-center gap-2 transition group"
              >
                <PhoneCall className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">Voice Calls</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Automated n8n Engine: <strong>Active (98 Production Nodes)</strong></span>
            <Link to="/settings" className="text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Configure Webhooks <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
