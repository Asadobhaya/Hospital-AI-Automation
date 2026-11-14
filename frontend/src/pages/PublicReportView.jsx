// src/pages/PublicReportView.jsx — Public Secure Patient Lab Report Viewer (Medical Blue & White)
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
  Phone,
} from 'lucide-react';
import Button from '../components/Button';
import { API_BASE } from '../services/api';

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
        const res = await fetch(`${API_BASE}/reports/view/${encodeURIComponent(token)}`);
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
    <div className="min-h-screen bg-[#F5F8FC] text-[#4B5D6B] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <main className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Header */}
        <header className="flex justify-center items-center gap-3 mb-8">
          <img
            src="/logo.png"
            alt="MediPulse AI Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-[#DFE6EE] bg-white p-0.5"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
              MediPulse <span className="text-[#2F78C8] font-semibold">Diagnostic Portal</span>
            </h1>
            <p className="text-xs text-[#617181]">Encrypted Patient Medical Record Access</p>
          </div>
        </header>

        {loading ? (
          <section aria-label="Loading diagnostic report" className="card-surface p-8 rounded-2xl text-center">
            <div className="w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-3" role="status" aria-label="Loading" />
            <p className="text-sm text-[#4B5D6B] font-medium">Verifying cryptographic token and retrieving diagnostic report...</p>
          </section>
        ) : error ? (
          <section aria-label="Report error notice" className="card-surface border-[#B42318]/40 p-8 rounded-2xl text-center">
            <div className="w-12 h-12 bg-[#FDECEC] text-[#B42318] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#B42318]/20" aria-hidden="true">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-[#172B3A]">Diagnostic Report Unavailable</h2>
            <p className="text-sm text-[#4B5D6B] mt-2 max-w-md mx-auto">{error}</p>
            <div className="mt-6 p-4 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE] text-xs text-[#617181] text-left">
              <p className="font-semibold text-[#172B3A]">Security & Privacy Notice:</p>
              <p className="mt-1">For patient safety and compliance with data privacy regulations, lab report access links automatically expire 7 days after issue or upon clinical revocation.</p>
              <p className="mt-2 text-[#4B5D6B]">
                To request a refreshed link, contact the hospital medical records desk: <strong className="text-[#172B3A] font-mono">+92 51 111 000 000</strong>
              </p>
            </div>
          </section>
        ) : (
          <article className="card-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-[#DFE6EE]">
            <header className="flex items-center justify-between pb-5 border-b border-[#DFE6EE]">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18794E] bg-[#E7F5EC] border border-[#18794E]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Cryptographically Verified Link
                </span>
                <h2 className="text-lg font-bold text-[#172B3A] mt-2">{report.reportType}</h2>
              </div>
              <span className="text-xs text-[#617181] bg-[#F5F8FC] px-2.5 py-1 rounded-lg border border-[#DFE6EE] font-mono">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </header>

            {report.isCritical && (
              <div role="alert" className="mt-5 p-3.5 bg-[#FDECEC] border border-[#B42318]/40 rounded-xl flex items-start gap-3 text-[#B42318] text-xs">
                <AlertCircle className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="block font-semibold text-[#911b11]">Priority Clinical Notice</strong>
                  <span>Your laboratory findings contain flagged parameters designated by your physician for clinical follow-up. Please schedule a consultation with your doctor promptly.</span>
                </div>
              </div>
            )}

            <dl className="mt-6 space-y-3 text-xs">
              <div className="p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE] flex justify-between items-center">
                <dt className="text-[#617181]">Patient Full Name:</dt>
                <dd className="text-[#172B3A] font-semibold text-sm">{report.patientName}</dd>
              </div>

              {report.doctorNotes && (
                <div className="p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE]">
                  <dt className="text-[#617181] font-semibold mb-1">Attending Physician Impressions:</dt>
                  <dd className="text-[#172B3A] leading-relaxed font-normal">{report.doctorNotes}</dd>
                </div>
              )}

              <div className="flex items-center justify-between text-[#617181] pt-1">
                <dt className="flex items-center gap-1.5 text-[#617181]">
                  <Clock className="w-3.5 h-3.5 text-[#8898AA]" aria-hidden="true" /> Link Valid Until:
                </dt>
                <dd className="text-[#172B3A] font-mono">{new Date(report.expiresAt).toLocaleDateString()}</dd>
              </div>
            </dl>

            <div className="mt-6 pt-5 border-t border-[#DFE6EE] flex flex-col sm:flex-row gap-3">
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

            <footer className="mt-6 text-center text-xs text-[#8898AA] flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hospital 24x7 Diagnostics Desk: +92 51 111 000 000</span>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
