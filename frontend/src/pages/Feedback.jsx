// src/pages/Feedback.jsx — Patient Satisfaction & Automated Sentiment Escalations
import React, { useEffect, useState } from 'react';
import {
  Star,
  Download,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import Pagination from '../components/Pagination';

export default function Feedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ average: 0, total: 0, positive: 0, escalated: 0 });

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(ratingFilter !== 'all' && { rating: ratingFilter })
      });

      const res = await fetch(`/api/feedback?${query.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setFeedbackList(list);
        if (json.pagination) setTotalPages(json.pagination.totalPages || 1);

        if (list.length > 0) {
          const total = list.length;
          const sum = list.reduce((acc, curr) => acc + (curr.rating || 0), 0);
          const positive = list.filter(f => f.rating >= 4).length;
          const escalated = list.filter(f => f.rating <= 3).length;
          setStats({
            average: (sum / total).toFixed(1),
            total,
            positive,
            escalated
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, ratingFilter]);

  const handleExportCSV = () => {
    window.open('/api/feedback/export', '_blank');
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Feedback & NPS</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated WhatsApp surveys, 1-3 star escalation alerts & 4-5 star Google review routing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFeedback}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-md shadow-primary-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Average Rating</span>
          <div className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <span>{stats.average || '4.5'}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Submissions</span>
          <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-emerald-400 uppercase">Google Review Triggers (4-5★)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.positive}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-red-400 uppercase">Staff Escalations (1-3★)</span>
          <div className="text-2xl font-bold text-red-400 mt-2">{stats.escalated}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Filter by Rating:</span>
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars (Escalated)</option>
            <option value="2">2 Stars (Escalated)</option>
            <option value="1">1 Star (Escalated)</option>
          </select>
        </div>
        <span className="text-xs text-slate-400">Automated 2-hour post-consultation dispatch</span>
      </div>

      {/* Feedback Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Retrieving feedback surveys...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Smile className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No feedback entries found</h3>
            <p className="text-xs text-slate-400 mt-1">Survey responses will appear after appointments are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Comments</th>
                  <th className="py-3.5 px-4">Automated Journey Route</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {feedbackList.map((f) => {
                  const isUnhappy = f.rating <= 3;
                  return (
                    <tr key={f.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{f.patient?.name || `Patient #${f.patient_id}`}</div>
                        <div className="text-xs font-mono text-slate-400">{f.patient?.phone || ''}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {renderStars(f.rating)}
                          <span className="text-xs font-bold text-white">{f.rating}/5</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 max-w-sm">
                        {f.comments || <span className="text-slate-500 italic">No verbal comments left</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {isUnhappy ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" /> Escalated to Front Desk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sent Google Review Link
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(f.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
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
