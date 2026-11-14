// src/pages/Dashboard.jsx — Hospital Executive & Operations Dashboard (Medical Blue & White)
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
  confirmed: '#18794E', // Clinical Emerald
  reschedule_requested: '#8A4B08', // Clinical Amber
  cancelled: '#B42318', // Clinical Rose
  failedOrNoAnswer: '#617181', // Clinical Slate
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
        <div className="h-8 bg-[#E7F1FB] rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white border border-[#DFE6EE] rounded-2xl animate-pulse" />
          <div className="h-80 bg-white border border-[#DFE6EE] rounded-2xl animate-pulse" />
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
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">Clinical & AI Operations Hub</h1>
          <p className="text-sm text-[#617181] mt-1">
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#2F78C8] hover:bg-[#2462A5] shadow-sm border border-[#2F78C8] transition min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#175DB5]"
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
          className="bg-[#FDECEC] border border-[#B42318]/30 p-4 rounded-xl text-[#B42318] text-sm flex items-center justify-between"
        >
          <span>Failed to load latest metrics: {error}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="underline font-semibold hover:text-[#911b11] cursor-pointer"
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
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#617181]">Today's Appointments</h2>
            <div className="p-2.5 bg-[#E7F1FB] text-[#2F78C8] rounded-xl" aria-hidden="true">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#172B3A] tracking-tight">{summary.todayTotal}</span>
            <span className="text-xs text-[#18794E] flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> Active Day
            </span>
          </div>
          <div className="mt-2 text-xs text-[#617181] flex items-center gap-2">
            <span>{summary.completed} completed</span>
            <span aria-hidden="true">•</span>
            <span className="text-[#8A4B08] font-semibold">{summary.upcoming} remaining</span>
          </div>
        </article>

        {/* Pending Actions */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#617181]">Pending Actions</h2>
            <div className="p-2.5 bg-[#FFF2D8] text-[#8A4B08] rounded-xl" aria-hidden="true">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#172B3A] tracking-tight">{summary.pendingConfirmations}</span>
            <span className="text-xs text-[#8A4B08] font-semibold">Calls Queued</span>
          </div>
          <div className="mt-2 text-xs text-[#617181]">
            Awaiting 24h & 2h voice verification
          </div>
        </article>

        {/* Missed Appointments */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#617181]">Missed / No-Shows</h2>
            <div className="p-2.5 bg-[#FDECEC] text-[#B42318] rounded-xl" aria-hidden="true">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#172B3A] tracking-tight">{summary.missed}</span>
            <span className="text-xs text-[#B42318] font-semibold">Re-engagement</span>
          </div>
          <div className="mt-2 text-xs text-[#617181]">
            WhatsApp follow-up dispatched
          </div>
        </article>

        {/* Escalations */}
        <article className="card-surface p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#617181]">Staff Escalations</h2>
            <div
              className={`p-2.5 rounded-xl ${
                summary.unresolvedEscalations > 0 ? 'bg-[#FDECEC] text-[#B42318]' : 'bg-[#E7F5EC] text-[#18794E]'
              }`}
              aria-hidden="true"
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#172B3A] tracking-tight">{summary.unresolvedEscalations}</span>
            <span
              className={`text-xs font-semibold ${
                summary.unresolvedEscalations > 0 ? 'text-[#B42318]' : 'text-[#18794E]'
              }`}
            >
              {summary.unresolvedEscalations > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className="mt-2 text-xs text-[#617181]">
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
              <h2 className="text-base font-semibold text-[#172B3A] tracking-tight">7-Day Appointment Volume</h2>
              <p className="text-xs text-[#617181]">Confirmed, completed, and cancelled trends</p>
            </div>
            <span className="text-xs text-[#2458A6] bg-[#E7F0FF] px-2.5 py-1 rounded-full border border-[#DFE6EE] font-medium">
              Live Database
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#617181" fontSize={11} tickLine={false} />
                <YAxis stroke="#617181" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#DFE6EE',
                    borderRadius: '0.75rem',
                    color: '#172B3A',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(23, 43, 58, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#2F78C8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#18794E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#B42318" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* AI Voice Call Outcomes Pie */}
        <article className="card-surface p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-[#172B3A] tracking-tight">AI Voice Call Outcomes</h2>
              <PhoneCall className="w-4 h-4 text-[#2F78C8]" aria-hidden="true" />
            </div>
            <p className="text-xs text-[#617181] mb-4">Automated 24h & 2h reminder responses</p>

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
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DFE6EE',
                        borderRadius: '0.75rem',
                        color: '#172B3A',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(23, 43, 58, 0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-[#8898AA]">
                No outbound calls recorded yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#DFE6EE] text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#18794E]" aria-hidden="true" />
              <span className="text-[#4B5D6B]">Confirmed: {callStats.confirmed || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8A4B08]" aria-hidden="true" />
              <span className="text-[#4B5D6B]">Reschedule: {callStats.rescheduleRequested || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#B42318]" aria-hidden="true" />
              <span className="text-[#4B5D6B]">Cancelled: {callStats.cancelled || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#617181]" aria-hidden="true" />
              <span className="text-[#4B5D6B]">No Answer: {callStats.failedOrNoAnswer || 0}</span>
            </div>
          </div>
        </article>
      </section>

      {/* Integration Health & Quick Actions */}
      <section aria-label="System Subsystems & Quick Navigation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Subsystems Status */}
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#18794E]" aria-hidden="true" />
            System Integration Status
          </h2>
          <div className="space-y-2.5 text-xs">
            {Object.entries(integrationHealth).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE]"
              >
                <span className="capitalize font-medium text-[#172B3A]">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#617181] text-[11px]">{val.provider}</span>
                  <span className="w-2 h-2 rounded-full bg-[#18794E] ring-4 ring-[#18794E]/20" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Quick Launchpad */}
        <article className="lg:col-span-2 card-surface p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-3">
              Automated Workflows & Hub Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/appointments"
                className="p-3.5 bg-[#F5F8FC] hover:bg-[#EDF4FB] rounded-xl border border-[#DFE6EE] flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#175DB5]"
              >
                <Calendar className="w-5 h-5 text-[#2F78C8] group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-[#173A5E]">Book Slot</span>
              </Link>
              <Link
                to="/messages"
                className="p-3.5 bg-[#F5F8FC] hover:bg-[#EDF4FB] rounded-xl border border-[#DFE6EE] flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#175DB5]"
              >
                <MessageSquare className="w-5 h-5 text-[#18794E] group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-[#173A5E]">WhatsApp Chat</span>
              </Link>
              <Link
                to="/reports"
                className="p-3.5 bg-[#F5F8FC] hover:bg-[#EDF4FB] rounded-xl border border-[#DFE6EE] flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#175DB5]"
              >
                <FileText className="w-5 h-5 text-[#2458A6] group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-[#173A5E]">Lab Reports</span>
              </Link>
              <Link
                to="/calls"
                className="p-3.5 bg-[#F5F8FC] hover:bg-[#EDF4FB] rounded-xl border border-[#DFE6EE] flex flex-col items-center justify-center text-center gap-2 transition group min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#175DB5]"
              >
                <PhoneCall className="w-5 h-5 text-[#8A4B08] group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-xs font-medium text-[#173A5E]">Voice Calls</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DFE6EE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#617181]">
            <span>Automated n8n Engine: <strong className="text-[#172B3A]">Active (98 Production Nodes)</strong></span>
            <Link
              to="/settings"
              className="text-[#2F78C8] hover:text-[#173A5E] flex items-center gap-1 font-medium"
            >
              Configure Webhooks <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
