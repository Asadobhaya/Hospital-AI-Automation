// src/pages/Feedback.jsx — Patient Satisfaction & Automated Sentiment Escalations (Medical Blue & White)
import React, { useEffect, useState } from 'react';
import {
  Star,
  Download,
  AlertTriangle,
  Smile,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { request, API_BASE } from '../services/api';

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
        ...(ratingFilter !== 'all' && { rating: ratingFilter }),
      });

      const res = await request(`/feedback?${query.toString()}`);
      const list = res?.data || res || [];
      setFeedbackList(list);
      if (res?.pagination) setTotalPages(res.pagination.totalPages || 1);

      if (list.length > 0) {
        const total = list.length;
        const sum = list.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        const positive = list.filter((f) => f.rating >= 4).length;
        const escalated = list.filter((f) => f.rating <= 3).length;
        setStats({
          average: (sum / total).toFixed(1),
          total,
          positive,
          escalated,
        });
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
    window.open(`${API_BASE}/feedback/export`, '_blank');
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-500' : 'text-[#DFE6EE]'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">Patient Feedback & NPS</h1>
          <p className="text-sm text-[#617181] mt-1">
            Automated WhatsApp surveys, 1-3 star escalation alerts & 4-5 star review routing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={fetchFeedback} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleExportCSV}
            icon={Download}
          >
            Export CSV
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <section aria-label="Feedback Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-[#617181] uppercase tracking-wider">Average Rating</h2>
          <div className="text-3xl font-bold text-[#172B3A] tracking-tight mt-2 flex items-center gap-2">
            <span>{stats.average || '4.5'}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" aria-hidden="true" />
          </div>
        </article>
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-[#617181] uppercase tracking-wider">Total Submissions</h2>
          <div className="text-3xl font-bold text-[#172B3A] tracking-tight mt-2">{stats.total}</div>
        </article>
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-[#18794E] uppercase tracking-wider">Positive (4-5★)</h2>
          <div className="text-3xl font-bold text-[#18794E] tracking-tight mt-2">{stats.positive}</div>
        </article>
        <article className="card-surface p-5 rounded-2xl">
          <h2 className="text-xs font-semibold text-[#B42318] uppercase tracking-wider">Escalated (1-3★)</h2>
          <div className="text-3xl font-bold text-[#B42318] tracking-tight mt-2">{stats.escalated}</div>
        </article>
      </section>

      {/* Filter Bar */}
      <section
        aria-label="Filter feedback"
        className="card-surface p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="rating-filter" className="text-xs text-[#617181] font-semibold">
            Filter by Rating:
          </label>
          <select
            id="rating-filter"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="form-input py-1.5 px-3 text-xs w-auto min-h-[38px]"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars (Escalated)</option>
            <option value="2">2 Stars (Escalated)</option>
            <option value="1">1 Star (Escalated)</option>
          </select>
        </div>
        <span className="text-xs text-[#617181]">Automated 2-hour post-consultation dispatch</span>
      </section>

      {/* Feedback Table */}
      <section aria-label="Feedback Submissions" className="card-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#617181]" role="status">
            <div className="w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Retrieving feedback surveys...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <EmptyState
            icon={Smile}
            title="No feedback entries found"
            message="Survey responses will appear here after patient appointments are concluded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#DFE6EE] bg-[#F5F8FC] text-xs font-semibold text-[#172B3A] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Patient</th>
                  <th scope="col" className="py-3.5 px-5">Rating</th>
                  <th scope="col" className="py-3.5 px-5">Comments</th>
                  <th scope="col" className="py-3.5 px-5">Automated Journey Route</th>
                  <th scope="col" className="py-3.5 px-5">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE6EE] text-sm">
                {feedbackList.map((f) => {
                  const isUnhappy = f.rating <= 3;
                  return (
                    <tr key={f.id} className="hover:bg-[#EDF4FB] transition">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#172B3A]">{f.patient?.name || `Patient #${f.patient_id}`}</div>
                        <div className="text-xs font-mono text-[#617181]">{f.patient?.phone || ''}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          {renderStars(f.rating)}
                          <span className="text-xs font-bold text-[#172B3A]">{f.rating}/5</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#4B5D6B] max-w-sm">
                        {f.comments || <span className="text-[#8898AA] italic">No verbal comments left</span>}
                      </td>
                      <td className="py-3.5 px-5">
                        {isUnhappy ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#B42318] font-semibold bg-[#FDECEC] border border-[#B42318]/20 px-2.5 py-1 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Escalated to Front Desk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#18794E] font-semibold bg-[#E7F5EC] border border-[#18794E]/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Sent Google Review Link
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#617181]">
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
          <div className="p-4 border-t border-[#DFE6EE]">
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
