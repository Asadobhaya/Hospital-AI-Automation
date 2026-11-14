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
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

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
        ...(searchTerm && { search: searchTerm })
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-400 mt-1">Verified patient records, contact identifiers & visit history</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name or phone number..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Patient Cards / Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading patient records...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No patients found</h3>
            <p className="text-xs text-slate-400 mt-1">No registered records match your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Last Inbound Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {p.last_message_at ? new Date(p.last_message_at).toLocaleString() : 'Registered via Booking'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <UserCheck className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenPatientHistory(p)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        View History
                      </button>
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

      {/* Patient History Detail Modal */}
      <Modal
        isOpen={Boolean(selectedPatient)}
        onClose={() => { setSelectedPatient(null); setPatientHistory(null); }}
        title={`Patient Record: ${selectedPatient?.name || ''}`}
      >
        {historyLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Fetching clinical history...</p>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400">Phone:</span>{' '}
                <strong className="text-white font-mono">{selectedPatient?.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400">Patient ID:</span>{' '}
                <strong className="text-primary-400">#{selectedPatient?.id}</strong>
              </div>
            </div>

            {/* Appointments */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-400" /> Appointment History
              </h4>
              {patientHistory?.appointments?.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.appointments.map((a) => (
                    <div key={a.id} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{a.doctor?.name || `Doctor #${a.doctor_id}`}</div>
                        <div className="text-slate-400">{new Date(a.slot_time).toLocaleString()}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase bg-slate-800 text-slate-300">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No appointments recorded.</p>
              )}
            </div>

            {/* Reports */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" /> Lab & Diagnostic Reports
              </h4>
              {patientHistory?.reports?.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.reports.map((r) => (
                    <div key={r.id} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{r.report_type}</div>
                        <div className="text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${r.is_revoked ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                        {r.is_revoked ? 'Revoked' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No diagnostic reports found.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
