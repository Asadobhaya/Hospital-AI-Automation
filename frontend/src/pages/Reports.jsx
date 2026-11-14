// src/pages/Reports.jsx — Diagnostic Lab Reports & Cryptographic Token Access
import React, { useEffect, useState } from 'react';
import {
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedToken, setCopiedToken] = useState(null);

  // New Report Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [reportForm, setReportForm] = useState({
    patientId: '',
    reportType: 'Complete Blood Count (CBC)',
    reportUrl: 'https://storage.hospital.internal/reports/sample_report.pdf',
    doctorNotes: '',
    isCritical: false
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(searchTerm && { search: searchTerm })
      });

      const [repRes, patRes] = await Promise.all([
        fetch(`/api/reports?${query.toString()}`, { credentials: 'include' }),
        fetch('/api/patients?limit=50', { credentials: 'include' })
      ]);

      if (repRes.ok) {
        const json = await repRes.json();
        setReports(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
      }
      if (patRes.ok) {
        const pjson = await patRes.json();
        setPatients(pjson.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, searchTerm]);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientId: parseInt(reportForm.patientId, 10),
          reportType: reportForm.reportType,
          reportUrl: reportForm.reportUrl,
          doctorNotes: reportForm.doctorNotes,
          isCritical: reportForm.isCritical
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || json.message || 'Failed to issue report');

      setIsModalOpen(false);
      setReportForm({
        patientId: '',
        reportType: 'Complete Blood Count (CBC)',
        reportUrl: 'https://storage.hospital.internal/reports/sample_report.pdf',
        doctorNotes: '',
        isCritical: false
      });
      fetchReports();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (reportId) => {
    if (!confirm('Are you sure you want to permanently revoke this access link?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/revoke`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (token) => {
    const fullUrl = `${window.location.origin}/reports/view?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const calculateDaysRemaining = (expiresAt) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? `${days}d left` : 'Expired';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Diagnostic Lab Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated WhatsApp delivery with 32-byte cryptographic tokens & 7-day auto-expiry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-md shadow-primary-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Issue Lab Report
          </button>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Cryptographic URL Tokenization Active</h4>
            <p className="text-xs text-slate-400">Tokens are generated with Node.js crypto.randomBytes(32) — zero guessability or enumeration risks.</p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          Server-Side Expiry Guard
        </span>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Fetching reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No reports issued yet</h3>
            <p className="text-xs text-slate-400 mt-1">Issue a lab report to trigger automated WhatsApp delivery.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Test / Report Type</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Access Count</th>
                  <th className="py-3.5 px-4">Security Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {reports.map((r) => {
                  const isExpired = new Date() > new Date(r.expires_at);
                  const isRevoked = r.is_revoked;

                  return (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{r.patient?.name || `Patient #${r.patient_id}`}</div>
                        <div className="text-xs font-mono text-slate-400">{r.patient?.phone || ''}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200 flex items-center gap-1.5">
                          {r.is_critical && (
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" title="Critical Result" />
                          )}
                          <span>{r.report_type}</span>
                        </div>
                        {r.doctor_notes && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{r.doctor_notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{calculateDaysRemaining(r.expires_at)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Expires: {new Date(r.expires_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                        {r.access_count || 0} views
                      </td>
                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                            <ShieldX className="w-3.5 h-3.5" /> Revoked
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                            <Clock className="w-3.5 h-3.5" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> Active Link
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isRevoked && !isExpired && (
                            <button
                              onClick={() => handleCopyLink(r.secure_token)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              title="Copy secure patient link"
                            >
                              {copiedToken === r.secure_token ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedToken === r.secure_token ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                          )}
                          {!isRevoked && (
                            <button
                              onClick={() => handleRevoke(r.id)}
                              className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
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

      {/* Issue Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalError(''); }}
        title="Issue Diagnostic Report"
      >
        <form onSubmit={handleCreateReport} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Patient</label>
            <select
              required
              value={reportForm.patientId}
              onChange={(e) => setReportForm({ ...reportForm, patientId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Report / Test Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Blood Count (CBC) with ESR"
              value={reportForm.reportType}
              onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Report PDF URL</label>
            <input
              type="url"
              required
              value={reportForm.reportUrl}
              onChange={(e) => setReportForm({ ...reportForm, reportUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Consulting Notes / Impressions</label>
            <textarea
              rows="2"
              placeholder="e.g. Parameters within normal range, follow up in 3 months"
              value={reportForm.doctorNotes}
              onChange={(e) => setReportForm({ ...reportForm, doctorNotes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCritical"
              checked={reportForm.isCritical}
              onChange={(e) => setReportForm({ ...reportForm, isCritical: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isCritical" className="text-xs font-medium text-red-300">
              Flag as Critical Result (Triggers urgent doctor notification)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Generating 32-byte token...' : 'Generate & Issue'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
