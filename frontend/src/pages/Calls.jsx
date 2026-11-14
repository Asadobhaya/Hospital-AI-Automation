// src/pages/Calls.jsx — Outbound AI Voice Reminders & Webhook Logs
import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  PhoneForwarded,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, reschedule: 0, failed: 0 });

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(outcomeFilter !== 'all' && { outcome: outcomeFilter })
      });

      const res = await fetch(`/api/calls?${query.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const callLogs = json.data || [];
        setCalls(callLogs);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }

        // Aggregate stats
        const confirmed = callLogs.filter(c => c.outcome === 'confirmed').length;
        const reschedule = callLogs.filter(c => c.outcome === 'reschedule_requested').length;
        const failed = callLogs.filter(c => c.outcome === 'failed' || c.outcome === 'no_answer').length;
        setStats({ total: callLogs.length, confirmed, reschedule, failed });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [page, outcomeFilter]);

  const handleManualRetry = async (callId) => {
    setRetryingId(callId);
    try {
      const res = await fetch(`/api/calls/${callId}/retry`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        fetchCalls();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Outbound Voice Gateway</h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous reminder calls, conversational webhook responses & automated retry logic
          </p>
        </div>
        <button
          onClick={fetchCalls}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Calls
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Calls Made</span>
          <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-emerald-400 uppercase">Confirmed Attendance</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.confirmed}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-amber-400 uppercase">Reschedules Requested</span>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.reschedule}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-red-400 uppercase">No Answer / Failed</span>
          <div className="text-2xl font-bold text-red-400 mt-2">{stats.failed}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Filter by Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Outcomes</option>
            <option value="confirmed">Confirmed</option>
            <option value="reschedule_requested">Reschedule Requested</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_answer">No Answer</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <span className="text-xs text-slate-400">HMAC-SHA256 Protected Webhooks</span>
      </div>

      {/* Calls Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Fetching call records...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <PhoneCall className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No voice logs found</h3>
            <p className="text-xs text-slate-400 mt-1">Scheduled calls will populate here upon webhook callback.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Patient / Phone</th>
                  <th className="py-3.5 px-4">Trigger Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4">Transcript Summary</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{c.patient_name || 'Patient'}</div>
                      <div className="text-xs font-mono text-slate-400">{c.patient_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-300 capitalize">{c.trigger_type || '24h Reminder'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {c.duration_seconds ? `${c.duration_seconds}s` : '0s'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.outcome || c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate">
                      {c.transcript_summary || 'Autonomous voice interaction completed.'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {(c.outcome === 'failed' || c.outcome === 'no_answer') && (
                        <button
                          onClick={() => handleManualRetry(c.id)}
                          disabled={retryingId === c.id}
                          className="px-2.5 py-1 text-xs font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg flex items-center gap-1 ml-auto transition cursor-pointer"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingId === c.id ? 'animate-spin' : ''}`} />
                          Retry Call
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/60">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
