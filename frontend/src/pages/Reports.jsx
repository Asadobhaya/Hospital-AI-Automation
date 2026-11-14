// src/pages/Reports.jsx — Diagnostic Lab Reports & Cryptographic Token Access (Medical Blue & White)
import React, { useEffect, useState } from 'react';
import {
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  ShieldX,
  ExternalLink,
} from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { request, reportsAPI } from '../services/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedToken, setCopiedToken] = useState(null);
  const [revokingReport, setRevokingReport] = useState(null);

  // New Report Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [reportForm, setReportForm] = useState({
    patientId: '',
    reportType: 'Complete Blood Count (CBC)',
    reportUrl: 'https://storage.hospital.internal/reports/sample_report.pdf',
    doctorNotes: '',
    isCritical: false,
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(searchTerm && { search: searchTerm }),
      });

      const [repData, patData] = await Promise.all([
        request(`/reports?${query.toString()}`),
        request('/patients?limit=50'),
      ]);

      setReports(repData?.data || repData || []);
      if (repData?.pagination) {
        setTotalPages(repData.pagination.totalPages || 1);
      }
      setPatients(patData?.data || patData || []);
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
      await request('/reports', {
        method: 'POST',
        body: {
          patientId: parseInt(reportForm.patientId, 10),
          reportType: reportForm.reportType,
          reportUrl: reportForm.reportUrl,
          doctorNotes: reportForm.doctorNotes,
          isCritical: reportForm.isCritical,
        },
      });

      setIsModalOpen(false);
      setReportForm({
        patientId: '',
        reportType: 'Complete Blood Count (CBC)',
        reportUrl: 'https://storage.hospital.internal/reports/sample_report.pdf',
        doctorNotes: '',
        isCritical: false,
      });
      fetchReports();
    } catch (err) {
      setModalError(err?.message || 'Failed to issue report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingReport) return;
    try {
      await reportsAPI.revoke(revokingReport.id);
      setRevokingReport(null);
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (token) => {
    const fullUrl = `${window.location.origin}/reports/view?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const calculateDaysRemaining = (expiryDate) => {
    const diff = new Date(expiryDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    return `${days}d remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">Diagnostic Lab Reports</h1>
          <p className="text-sm text-[#617181] mt-1">
            Automated delivery with 32-byte cryptographic tokens & 7-day auto-expiry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={fetchReports} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon={Plus}
          >
            Issue Lab Report
          </Button>
        </div>
      </header>

      {/* Security Architecture Note */}
      <div className="card-surface p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E7F1FB] text-[#2F78C8] rounded-xl shrink-0" aria-hidden="true">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#172B3A]">Cryptographic URL Tokenization Active</h2>
            <p className="text-xs text-[#617181]">
              Diagnostic tokens use Node.js crypto.randomBytes(32) — zero guessability or enumeration risks.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#18794E] bg-[#E7F5EC] border border-[#18794E]/20 px-3 py-1 rounded-full whitespace-nowrap">
          Server-Side Expiry Guard
        </span>
      </div>

      {/* Reports Table */}
      <section aria-label="Diagnostic Reports" className="card-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#617181]" role="status">
            <div className="w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Fetching reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports issued yet"
            message="Issue a diagnostic lab report to generate a secure access token for the patient."
            actionLabel="Issue Lab Report"
            onAction={() => setIsModalOpen(true)}
            actionIcon={Plus}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#DFE6EE] bg-[#F5F8FC] text-xs font-semibold text-[#172B3A] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Patient</th>
                  <th scope="col" className="py-3.5 px-5">Test / Report Type</th>
                  <th scope="col" className="py-3.5 px-5">Validity</th>
                  <th scope="col" className="py-3.5 px-5">Access Count</th>
                  <th scope="col" className="py-3.5 px-5">Security Status</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE6EE] text-sm">
                {reports.map((r) => {
                  const isExpired = new Date() > new Date(r.expires_at);
                  const isRevoked = r.is_revoked;

                  return (
                    <tr key={r.id} className="hover:bg-[#EDF4FB] transition">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#172B3A]">{r.patient?.name || `Patient #${r.patient_id}`}</div>
                        <div className="text-xs font-mono text-[#617181]">{r.patient?.phone || ''}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#172B3A] flex items-center gap-1.5">
                          {r.is_critical && (
                            <span className="w-2 h-2 rounded-full bg-[#B42318] animate-pulse" title="Critical Result" />
                          )}
                          <span>{r.report_type}</span>
                        </div>
                        {r.doctor_notes && (
                          <div className="text-xs text-[#617181] truncate max-w-xs">{r.doctor_notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs">
                        <div className="flex items-center gap-1.5 text-[#4B5D6B]">
                          <Clock className="w-3.5 h-3.5 text-[#617181]" aria-hidden="true" />
                          <span>{calculateDaysRemaining(r.expires_at)}</span>
                        </div>
                        <div className="text-[10px] text-[#8898AA] mt-0.5">
                          Expires: {new Date(r.expires_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono text-[#4B5D6B]">
                        {r.access_count || 0} views
                      </td>
                      <td className="py-3.5 px-5">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#B42318] bg-[#FDECEC] border border-[#B42318]/20 px-2.5 py-0.5 rounded-full font-semibold">
                            <ShieldX className="w-3.5 h-3.5" aria-hidden="true" /> Revoked
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#8A4B08] bg-[#FFF2D8] border border-[#8A4B08]/20 px-2.5 py-0.5 rounded-full font-semibold">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#18794E] bg-[#E7F5EC] border border-[#18794E]/20 px-2.5 py-0.5 rounded-full font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Active Link
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isRevoked && !isExpired && (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(r.access_token)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#2F78C8] hover:text-[#173A5E] bg-[#E7F1FB] hover:bg-[#D4E6F8] rounded-lg transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#175DB5] cursor-pointer"
                              title="Copy secure link"
                            >
                              {copiedToken === r.access_token ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#18794E]" aria-hidden="true" />
                                  <span className="text-[#18794E]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          )}
                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => setRevokingReport(r)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#B42318] hover:text-[#911b11] bg-[#FDECEC] hover:bg-[#FCD8D8] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[#B42318] cursor-pointer"
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
          <div className="p-4 border-t border-[#DFE6EE]">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </section>

      {/* Issue Report Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError('');
        }}
        title="Issue Diagnostic Lab Report"
        description="Generates a high-entropy 32-byte cryptographic token with a 7-day auto-expiry schedule."
      >
        <form onSubmit={handleCreateReport} className="space-y-4">
          {modalError && (
            <div role="alert" className="p-3 bg-[#FDECEC] border border-[#B42318]/30 rounded-xl text-[#B42318] text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label htmlFor="report-patient" className="block text-xs font-semibold text-[#172B3A] mb-1">
              Select Patient
            </label>
            <select
              id="report-patient"
              required
              value={reportForm.patientId}
              onChange={(e) => setReportForm({ ...reportForm, patientId: e.target.value })}
              className="form-input"
            >
              <option value="">Choose patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-type" className="block text-xs font-semibold text-[#172B3A] mb-1">
              Diagnostic Test Category
            </label>
            <select
              id="report-type"
              value={reportForm.reportType}
              onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
              className="form-input"
            >
              <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
              <option value="Lipid Profile">Lipid Profile</option>
              <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
              <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
              <option value="HbA1c Blood Sugar">HbA1c Blood Sugar</option>
              <option value="Chest X-Ray Digital">Chest X-Ray Digital</option>
              <option value="Ultrasound Abdomen">Ultrasound Abdomen</option>
              <option value="MRI Brain Contrast">MRI Brain Contrast</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-url" className="block text-xs font-semibold text-[#172B3A] mb-1">
              PDF Document Storage URL
            </label>
            <input
              id="report-url"
              type="url"
              required
              value={reportForm.reportUrl}
              onChange={(e) => setReportForm({ ...reportForm, reportUrl: e.target.value })}
              className="form-input"
              placeholder="https://storage.hospital.internal/reports/sample.pdf"
            />
          </div>

          <div>
            <label htmlFor="report-notes" className="block text-xs font-semibold text-[#172B3A] mb-1">
              Pathologist / Doctor Notes (Optional)
            </label>
            <textarea
              id="report-notes"
              rows={2}
              value={reportForm.doctorNotes}
              onChange={(e) => setReportForm({ ...reportForm, doctorNotes: e.target.value })}
              placeholder="e.g. Mildly elevated WBC; advise clinical correlation..."
              className="form-input"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="report-critical"
              type="checkbox"
              checked={reportForm.isCritical}
              onChange={(e) => setReportForm({ ...reportForm, isCritical: e.target.checked })}
              className="rounded border-[#DFE6EE] text-[#B42318] focus:ring-[#B42318] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="report-critical" className="text-xs font-semibold text-[#B42318] cursor-pointer">
              Flag as Critical Result (Triggers urgent clinical escalation)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DFE6EE]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              Issue & Deliver Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revocation Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(revokingReport)}
        onClose={() => setRevokingReport(null)}
        onConfirm={handleConfirmRevoke}
        title="Revoke Diagnostic Link"
        message={`Are you sure you want to permanently revoke public token access for this ${revokingReport?.report_type} report? The patient will no longer be able to view this file until a new link is issued.`}
        confirmText="Revoke Access Link"
        danger={true}
      />
    </div>
  );
}
