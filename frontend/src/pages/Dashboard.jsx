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
  RefreshCw,
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
  Cell,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import Button from '../components/Button';
import { CardSkeleton } from '../components/Skeletons';

const CALL_COLORS = {
  confirmed: '#10b981', // Emerald
  reschedule_requested: '#f59e0b', // Amber
  cancelled: '#f43f5e', // Rose
  failedOrNoAnswer: '#64748b', // Slate
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setData(res?.data || res);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30s telemetry polling
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard metrics">
        <div className="h-8 bg-slate-800 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
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
    unresolvedEscalations: 0,
  };

  const trendData = data?.trend || [];
  const callStats = data?.callStats || {
    confirmed: 0,
    rescheduleRequested: 0,
    cancelled: 0,
    failedOrNoAnswer: 0,
  };

  const pieData = [
    { name: 'Confirmed', value: callStats.confirmed || 0, color: CALL_COLORS.confirmed },
    { name: 'Reschedule Req', value: callStats.rescheduleRequested || 0, color: CALL_COLORS.reschedule_requested },
    { name: 'Cancelled', value: callStats.cancelled || 0, color: CALL_COLORS.cancelled },
    { name: 'No Answer / Fail', value: callStats.failedOrNoAnswer || 0, color: CALL_COLORS.failedOrNoAnswer },
  ].filter((d) => d.value > 0);

  const integrationHealth = data?.integrationHealth || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clinical & AI Operations Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, automated patient journeys & voice scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Link
            to="/appointments"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-500 shadow-sm border border-primary-500/30 transition min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-rose-950/60 border border-rose-500/40 p-4 rounded-xl text-rose-200 text-sm flex items-center justify-between"
        >
          <span>Failed to load latest metrics: {error}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="underline text-rose-300 font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Metric Cards */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Appointments</h2>
            <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl" aria-hidden="true">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{summary.todayTotal}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> Active Day
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span>{summary.completed} completed</span>
            <span aria-hidden="true">•</span>
            <span className="text-amber-400 font-medium">{summary.upcoming} remaining</span>
          </div>
        </article>

        {/* Pending Actions */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Actions</h2>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl" aria-hidden="true">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{summary.pendingConfirmations}</span>
            <span className="text-xs text-amber-400 font-medium">Calls Queued</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Awaiting 24h & 2h voice verification
          </div>
        </article>

        {/* Missed Appointments */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Missed / No-Shows</h2>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl" aria-hidden="true">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{summary.missed}</span>
            <span className="text-xs text-rose-400 font-medium">Re-engagement</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            WhatsApp follow-up dispatched
          </div>
        </article>

        {/* Escalations */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Staff Escalations</h2>
            <div
              className={`p-2.5 rounded-xl ${
                summary.unresolvedEscalations > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}
              aria-hidden="true"
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{summary.unresolvedEscalations}</span>
            <span
              className={`text-xs font-medium ${
                summary.unresolvedEscalations > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary.unresolvedEscalations > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Unhappy feedback & emergency triage
          </div>
        </article>
      </section>

      {/* Main Charts & Analytics Section */}
      <section aria-label="Visual Telemetry Charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Appointment Volume Trend */}
        <article className="lg:col-span-2 card-surface p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">7-Day Appointment Volume</h2>
              <p className="text-xs text-slate-400">Confirmed, completed, and cancelled trends</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              Live Database
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* AI Voice Call Outcomes Pie */}
        <article className="card-surface p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-white tracking-tight">AI Voice Call Outcomes</h2>
              <PhoneCall className="w-4 h-4 text-primary-400" aria-hidden="true" />
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
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
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

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-slate-300">Confirmed: {callStats.confirmed || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="text-slate-300">Reschedule: {callStats.rescheduleRequested || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" aria-hidden="true" />
              <span className="text-slate-300">Cancelled: {callStats.cancelled || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500" aria-hidden="true" />
              <span className="text-slate-300">No Answer: {callStats.failedOrNoAnswer || 0}</span>
            </div>
          </div>
        </article>
      </section>

      {/* Integration Health & Quick Actions */}
      <section aria-label="System Subsystems & Quick Navigation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Subsystems Status */}
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            System Integration Status
          </h2>
          <div className="space-y-2.5 text-xs">
            {Object.entries(integrationHealth).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800"
              >
                <span className="capitalize font-medium text-slate-300">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">{val.provider}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Quick Launchpad */}
        <article className="lg:col-span-2 card-surface p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Automated Workflows & Hub Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/appointments"
                className="p-3.5 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Calendar className="w-5 h-5 text-primary-400 group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-300">Book Slot</span>
              </Link>
              <Link
                to="/messages"
                className="p-3.5 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-300">WhatsApp Chat</span>
              </Link>
              <Link
                to="/reports"
                className="p-3.5 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <FileText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-300">Lab Reports</span>
              </Link>
              <Link
                to="/calls"
                className="p-3.5 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <PhoneCall className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-300">Voice Calls</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
            <span>Automated n8n Engine: <strong className="text-slate-200">Active (98 Production Nodes)</strong></span>
            <Link
              to="/settings"
              className="text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium"
            >
              Configure Webhooks <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
