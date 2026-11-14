// src/pages/PublicReportView.jsx — Public Secure Patient Lab Report Viewer
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Download,
  AlertCircle,
  Activity,
  Phone
} from 'lucide-react';

export default function PublicReportView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No report token was provided in the URL.');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/view/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || json.message || 'Unable to access report');
        }
        setReport(json.data || json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            MediPulse <span className="text-primary-400 font-medium">Diagnostic Portal</span>
          </span>
        </div>

        {loading ? (
          <div className="bg-slate-800/90 border border-slate-700/80 p-8 rounded-2xl shadow-xl text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300">Verifying secure token and decrypting report access...</p>
          </div>
        ) : error ? (
          <div className="bg-slate-800/90 border border-red-500/50 p-8 rounded-2xl shadow-xl text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">Report Access Unavailable</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">{error}</p>
            <div className="mt-6 p-4 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-slate-400">
              <p>For security, diagnostic links expire automatically after 7 days or upon staff revocation.</p>
              <p className="mt-2 text-slate-300">
                To request a fresh secure link, please contact the hospital desk: <strong className="text-white">+91 99999 00000</strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/90 border border-slate-700/80 p-6 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-5 border-b border-slate-700/80">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically Verified Link
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{report.reportType}</h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>

            {report.isCritical && (
              <div className="mt-5 p-3.5 bg-red-950/60 border border-red-500/60 rounded-xl flex items-start gap-3 text-red-200 text-xs">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Priority Medical Notice</strong>
                  <span>Your report includes parameters that your physician has marked for clinical review. Please schedule a follow-up consultation promptly.</span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400">Patient Name:</span>
                <strong className="text-white text-sm">{report.patientName}</strong>
              </div>

              {report.doctorNotes && (
                <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1 font-medium">Physician Impressions:</span>
                  <p className="text-slate-200 text-xs leading-relaxed">{report.doctorNotes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Link Valid Until:
                </span>
                <strong className="text-slate-200">{new Date(report.expiresAt).toLocaleDateString()}</strong>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-700/80 flex flex-col sm:flex-row gap-3">
              <a
                href={report.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 transition"
              >
                <Download className="w-4 h-4" /> Download Official PDF Report
              </a>
            </div>

            <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Need help? Hospital 24x7 Help Desk: +91 99999 00000</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
