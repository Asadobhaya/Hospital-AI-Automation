// src/pages/Patients.jsx — Patient Directory & Medical History
import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  UserCheck,
} from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(searchTerm && { search: searchTerm }),
      });
      const res = await fetch(`/api/patients?${query.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load patients');
      const data = await res.json();
      setPatients(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, searchTerm]);

  const handleOpenPatientHistory = async (patient) => {
    setSelectedPatient(patient);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch patient history');
      const json = await res.json();
      setPatientHistory(json.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified patient records, contact identifiers & longitudinal visit history
          </p>
        </div>
      </header>

      {/* Search Input */}
      <section
        aria-label="Search patients"
        className="card-surface p-4 rounded-2xl flex items-center"
      >
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="patient-search"
            type="text"
            placeholder="Search by patient name or phone number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="form-input pl-10"
            aria-label="Search patients by name or phone"
          />
        </div>
      </section>

      {/* Patient Cards / Table */}
      <section aria-label="Patients Table" className="card-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400" role="status">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading patient records...</p>
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            message="No registered patient records match your search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Patient Name</th>
                  <th scope="col" className="py-3.5 px-5">Phone Number</th>
                  <th scope="col" className="py-3.5 px-5">Last Inbound Contact</th>
                  <th scope="col" className="py-3.5 px-5">Clinical Status</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5 font-medium text-white flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-xs shrink-0"
                        aria-hidden="true"
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-mono text-xs">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {p.last_message_at ? new Date(p.last_message_at).toLocaleString() : 'Registered via Booking'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenPatientHistory(p)}
                      >
                        View History
                      </Button>
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

      {/* Patient History Detail Modal */}
      <Modal
        open={Boolean(selectedPatient)}
        onClose={() => {
          setSelectedPatient(null);
          setPatientHistory(null);
        }}
        title={`Patient Record: ${selectedPatient?.name || ''}`}
        description="Comprehensive historical log of clinic appointments, voice verification calls, and lab diagnostic reports."
        size="lg"
      >
        {historyLoading ? (
          <div className="p-10 text-center text-slate-400" role="status">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Fetching clinical history...</p>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs">
              <div>
                <span className="text-slate-400">Verified Contact:</span>{' '}
                <strong className="text-white font-mono">{selectedPatient?.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400">Record ID:</span>{' '}
                <strong className="text-primary-400 font-mono">#{selectedPatient?.id}</strong>
              </div>
            </div>

            {/* Appointments */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />
                Appointment History
              </h3>
              {patientHistory?.appointments?.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.appointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-white">{a.doctor?.name || `Doctor #${a.doctor_id}`}</div>
                        <div className="text-slate-400 mt-0.5">{new Date(a.slot_time).toLocaleString()}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                  No appointments recorded for this patient.
                </p>
              )}
            </div>

            {/* Diagnostic Reports */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                Diagnostic Lab Reports
              </h3>
              {patientHistory?.reports?.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.reports.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-white">{r.report_type}</div>
                        <div className="text-slate-400 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <StatusBadge status={r.is_critical ? 'critical' : 'normal'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                  No lab reports generated for this patient.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
