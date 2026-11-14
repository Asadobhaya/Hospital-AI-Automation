// src/pages/Calls.jsx — Outbound AI Voice Reminders & Webhook Logs
import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

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
        ...(outcomeFilter !== 'all' && { outcome: outcomeFilter }),
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
        const confirmed = callLogs.filter((c) => c.outcome === 'confirmed').length;
        const reschedule = callLogs.filter((c) => c.outcome === 'reschedule_requested').length;
        const failed = callLogs.filter((c) => c.outcome === 'failed' || c.outcome === 'no_answer').length;
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
        credentials: 'include',
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
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Outbound Voice Gateway</h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous reminder calls, conversational webhook responses & automated retry logic
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={fetchCalls} icon={RefreshCw}>
          Refresh Calls
        </Button>
      </header>

      {/* Metric Cards */}
      <section aria-label="Voice Call Summary Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Calls Dispatched</h2>
          <div className="text-3xl font-bold text-white tracking-tight mt-2">{stats.total}</div>
        </article>
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Confirmed Attendance</h2>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight mt-2">{stats.confirmed}</div>
        </article>
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Reschedules Requested</h2>
          <div className="text-3xl font-bold text-amber-400 tracking-tight mt-2">{stats.reschedule}</div>
        </article>
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">No Answer / Failed</h2>
          <div className="text-3xl font-bold text-rose-400 tracking-tight mt-2">{stats.failed}</div>
        </article>
      </section>

      {/* Filter Bar */}
      <section
        aria-label="Filter call logs"
        className="card-surface p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="outcome-filter" className="text-xs text-slate-400 font-medium">
            Filter by Outcome:
          </label>
          <select
            id="outcome-filter"
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="form-input py-1.5 px-3 text-xs w-auto min-h-[38px]"
          >
            <option value="all">All Outcomes</option>
            <option value="confirmed">Confirmed</option>
            <option value="reschedule_requested">Reschedule Requested</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_answer">No Answer</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-mono">HMAC-SHA256 Protected Webhooks</span>
      </section>

      {/* Calls Table */}
      <section aria-label="Voice Call Records" className="card-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400" role="status">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Fetching call records...</p>
          </div>
        ) : calls.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="No voice logs found"
            message="Outbound voice appointment verification calls will appear here upon webhook completion."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Patient / Phone</th>
                  <th scope="col" className="py-3.5 px-5">Trigger Type</th>
                  <th scope="col" className="py-3.5 px-5">Duration</th>
                  <th scope="col" className="py-3.5 px-5">Outcome</th>
                  <th scope="col" className="py-3.5 px-5">Transcript Summary</th>
                  <th scope="col" className="py-3.5 px-5">Timestamp</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-white">{c.patient_name || 'Patient'}</div>
                      <div className="text-xs font-mono text-slate-400">{c.patient_phone}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs text-slate-300 capitalize">{c.trigger_type || '24h Reminder'}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-300">
                      {c.duration_seconds ? `${c.duration_seconds}s` : '0s'}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={c.outcome || c.status} />
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-300 max-w-xs truncate">
                      {c.transcript_summary || 'Autonomous voice interaction completed.'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {(c.outcome === 'failed' || c.outcome === 'no_answer') && (
                        <button
                          type="button"
                          onClick={() => handleManualRetry(c.id)}
                          disabled={retryingId === c.id}
                          className="px-3 py-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg flex items-center gap-1.5 ml-auto transition cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${retryingId === c.id ? 'animate-spin' : ''}`} aria-hidden="true" />
                          <span>Retry Call</span>
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
          <div className="p-4 border-t border-slate-800">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </section>
    </div>
  );
}
