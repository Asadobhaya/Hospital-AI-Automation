// src/pages/Appointments.jsx — Appointment Scheduling & Lifecycle Management
import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { appointmentsAPI, doctorsAPI } from '../services/api';

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelDialogAppt, setCancelDialogAppt] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    slotDate: getTomorrowDate(),
    slotTime: '10:00',
    notes: ''
  });

  // Reschedule Form State
  const [rescheduleForm, setRescheduleForm] = useState({
    slotDate: getTomorrowDate(),
    slotTime: '10:00',
    reason: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: '15',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(doctorFilter !== 'all' && { doctor_id: doctorFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const [apptsData, docsData] = await Promise.all([
        appointmentsAPI.list(params),
        doctorsAPI.list()
      ]);

      setAppointments(apptsData?.data || apptsData || []);
      if (apptsData?.pagination) {
        setTotalPages(apptsData.pagination.totalPages || 1);
        setTotalCount(apptsData.pagination.total || 0);
      }

      setDoctors(docsData?.data || docsData || []);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, doctorFilter, searchTerm]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      const fullSlotTime = `${bookingForm.slotDate}T${bookingForm.slotTime}:00`;
      await appointmentsAPI.create({
        patientName: bookingForm.patientName,
        patientPhone: bookingForm.patientPhone,
        doctorId: parseInt(bookingForm.doctorId, 10),
        slotTime: fullSlotTime,
        notes: bookingForm.notes
      });

      setIsBookModalOpen(false);
      setBookingForm({ patientName: '', patientPhone: '', doctorId: '', slotDate: getTomorrowDate(), slotTime: '10:00', notes: '' });
      fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to book slot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setActionError('');
    setActionLoading(true);

    try {
      const fullSlotTime = `${rescheduleForm.slotDate}T${rescheduleForm.slotTime}:00`;
      await appointmentsAPI.reschedule(selectedAppt.id, {
        newSlotTime: fullSlotTime,
        reason: rescheduleForm.reason
      });

      setIsRescheduleModalOpen(false);
      setSelectedAppt(null);
      fetchData();
    } catch (err) {
      setActionError(err.message || 'Rescheduling failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelDialogAppt) return;
    try {
      await appointmentsAPI.cancel(cancelDialogAppt.id);
      setCancelDialogAppt(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const formatSlotTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appointment Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time doctor calendar, automated reminders & double-booking prevention
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-md shadow-primary-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Book New Slot
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name or phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="reschedule_pending">Reschedule Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Doctor:</span>
            <select
              value={doctorFilter}
              onChange={(e) => { setDoctorFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-xs"
            >
              <option value="all">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Appointments List / Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Retrieving real appointments from database...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No appointments found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or book a new appointment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor & Department</th>
                  <th className="py-3.5 px-4">Slot Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Voice Confirmed</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {appointments.map((appt) => {
                  const { date, time } = formatSlotTime(appt.slot_time);
                  const patientName = appt.patient?.name || 'Patient';
                  const patientPhone = appt.patient?.phone || 'N/A';
                  const doctorName = appt.doctor?.name || `Doctor #${appt.doctor_id}`;
                  const department = appt.doctor?.specialization || 'Clinical';

                  return (
                    <tr key={appt.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{patientName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {patientPhone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{doctorName}</div>
                        <div className="text-xs text-primary-400">{department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> {date}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {time}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {appt.confirmed_via_call ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Call
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedAppt(appt);
                                  setIsRescheduleModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setCancelDialogAppt(appt)}
                                className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </>
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

        {/* Pagination Footer */}
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

      {/* Book New Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => { setIsBookModalOpen(false); setActionError(''); }}
        title="Book New Appointment"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Patient Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={bookingForm.patientName}
              onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Phone Number</label>
            <input
              type="text"
              required
              placeholder="+919876543210"
              value={bookingForm.patientPhone}
              onChange={(e) => setBookingForm({ ...bookingForm, patientPhone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Doctor</label>
            <select
              required
              value={bookingForm.doctorId}
              onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.department || d.specialization || 'Clinical'} ({d.start_time?.slice(0, 5) || '09:00'} - {d.end_time?.slice(0, 5) || '17:00'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={bookingForm.slotDate}
                onChange={(e) => setBookingForm({ ...bookingForm, slotDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Time (30m Slots)</label>
              <select
                value={bookingForm.slotTime}
                onChange={(e) => setBookingForm({ ...bookingForm, slotTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Consultation Reason / Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Regular blood pressure checkup..."
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {actionLoading ? 'Validating slot...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => { setIsRescheduleModalOpen(false); setSelectedAppt(null); setActionError(''); }}
        title={`Reschedule Appointment #${selectedAppt?.id || ''}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="text-xs text-slate-400 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
            Current: <strong>{selectedAppt?.patient?.name}</strong> with <strong>{selectedAppt?.doctor?.name}</strong> at{' '}
            {selectedAppt && formatSlotTime(selectedAppt.slot_time).date} {selectedAppt && formatSlotTime(selectedAppt.slot_time).time}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleForm.slotDate}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, slotDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Slot Time</label>
              <select
                value={rescheduleForm.slotTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, slotTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Reschedule</label>
            <input
              type="text"
              placeholder="e.g. Patient requested morning slot via WhatsApp"
              value={rescheduleForm.reason}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {actionLoading ? 'Updating slot...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelDialogAppt)}
        onClose={() => setCancelDialogAppt(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel the appointment for ${cancelDialogAppt?.patient?.name} on ${cancelDialogAppt && formatSlotTime(cancelDialogAppt.slot_time).date}? This will free up the doctor's slot.`}
        confirmText="Yes, Cancel Slot"
        type="danger"
      />
    </div>
  );
}
