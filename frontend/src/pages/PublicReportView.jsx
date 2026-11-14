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
import Button from '../components/Button';

export default function PublicReportView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No diagnostic report token was provided in the URL query.');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/view/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || json.message || 'Unable to access clinical diagnostic report');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <main className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Header */}
        <header className="flex justify-center items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10" aria-hidden="true">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              MediPulse <span className="text-teal-400 font-semibold">Diagnostic Portal</span>
            </h1>
            <p className="text-xs text-slate-400">Encrypted Patient Medical Record Access</p>
          </div>
        </header>

        {loading ? (
          <section aria-label="Loading diagnostic report" className="card-surface p-8 rounded-xl text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" role="status" aria-label="Loading" />
            <p className="text-sm text-slate-300 font-medium">Verifying cryptographic token and retrieving diagnostic report...</p>
          </section>
        ) : error ? (
          <section aria-label="Report error notice" className="card-surface border-red-500/40 p-8 rounded-xl text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center mx-auto mb-4 ring-1 ring-red-500/20" aria-hidden="true">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white">Diagnostic Report Unavailable</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">{error}</p>
            <div className="mt-6 p-4 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 text-left">
              <p className="font-medium text-slate-300">Security & Privacy Notice:</p>
              <p className="mt-1">For patient safety and compliance with data privacy regulations, lab report access links automatically expire 7 days after issue or upon clinical revocation.</p>
              <p className="mt-2 text-slate-300">
                To request a refreshed link, contact the hospital medical records desk: <strong className="text-white">+91 99999 00000</strong>
              </p>
            </div>
          </section>
        ) : (
          <article className="card-surface p-6 sm:p-8 rounded-xl shadow-lg border border-slate-800">
            <header className="flex items-center justify-between pb-5 border-b border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Cryptographically Verified Link
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{report.reportType}</h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </header>

            {report.isCritical && (
              <div role="alert" className="mt-5 p-3.5 bg-red-950/40 border border-red-500/40 rounded-lg flex items-start gap-3 text-red-200 text-xs">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="block font-semibold text-red-300">Priority Clinical Notice</strong>
                  <span>Your laboratory findings contain flagged parameters designated by your physician for clinical follow-up. Please schedule a consultation with your doctor promptly.</span>
                </div>
              </div>
            )}

            <dl className="mt-6 space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between items-center">
                <dt className="text-slate-400">Patient Full Name:</dt>
                <dd className="text-white font-semibold text-sm">{report.patientName}</dd>
              </div>

              {report.doctorNotes && (
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <dt className="text-slate-400 font-medium mb-1">Attending Physician Impressions:</dt>
                  <dd className="text-slate-200 leading-relaxed font-normal">{report.doctorNotes}</dd>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400 pt-1">
                <dt className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Link Valid Until:
                </dt>
                <dd className="text-slate-200 font-mono">{new Date(report.expiresAt).toLocaleDateString()}</dd>
              </div>
            </dl>

            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <a
                href={report.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="primary" size="lg" className="w-full">
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Download Official PDF Report
                </Button>
              </a>
            </div>

            <footer className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hospital 24x7 Diagnostics Desk: +91 99999 00000</span>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
