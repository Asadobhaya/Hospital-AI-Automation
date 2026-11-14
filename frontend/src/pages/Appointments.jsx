// src/pages/Appointments.jsx — Appointment Scheduling & Lifecycle Management
import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Search,
  Plus,
  RefreshCw,
  CalendarDays,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
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

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelDialogAppt, setCancelDialogAppt] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    slotDate: getTomorrowDate(),
    slotTime: '10:00',
    notes: '',
  });

  // Reschedule Form State
  const [rescheduleForm, setRescheduleForm] = useState({
    slotDate: getTomorrowDate(),
    slotTime: '10:00',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: '15',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(doctorFilter !== 'all' && { doctor_id: doctorFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const [apptsData, docsData] = await Promise.all([
        appointmentsAPI.list(params),
        doctorsAPI.list(),
      ]);

      setAppointments(apptsData?.data || apptsData || []);
      if (apptsData?.pagination) {
        setTotalPages(apptsData.pagination.totalPages || 1);
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
      const dateObj = new Date(`${bookingForm.slotDate}T${bookingForm.slotTime}:00`);
      const fullSlotTime = isNaN(dateObj.getTime())
        ? `${bookingForm.slotDate}T${bookingForm.slotTime}:00Z`
        : dateObj.toISOString();

      await appointmentsAPI.create({
        patientName: bookingForm.patientName.trim(),
        patientPhone: bookingForm.patientPhone.trim(),
        doctorId: parseInt(bookingForm.doctorId, 10),
        slotTime: fullSlotTime,
        notes: bookingForm.notes?.trim() || undefined,
      });

      setIsBookModalOpen(false);
      setBookingForm({
        patientName: '',
        patientPhone: '',
        doctorId: '',
        slotDate: getTomorrowDate(),
        slotTime: '10:00',
        notes: '',
      });
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
      const dateObj = new Date(`${rescheduleForm.slotDate}T${rescheduleForm.slotTime}:00`);
      const fullSlotTime = isNaN(dateObj.getTime())
        ? `${rescheduleForm.slotDate}T${rescheduleForm.slotTime}:00Z`
        : dateObj.toISOString();

      await appointmentsAPI.reschedule(selectedAppt.id, {
        newSlotTime: fullSlotTime,
        reason: rescheduleForm.reason?.trim() || undefined,
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
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appointment Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time doctor calendar, automated reminders & double-booking prevention
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsBookModalOpen(true)}
            icon={Plus}
          >
            Book New Slot
          </Button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section
        aria-label="Filter appointments"
        className="card-surface p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center"
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="appt-search"
            type="text"
            placeholder="Search patient name or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            aria-label="Search appointments by patient name or phone"
            className="form-input pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-status" className="text-xs text-slate-400 font-medium">
              Status:
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-input py-1.5 px-3 text-xs w-auto min-h-[38px]"
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
            <label htmlFor="filter-doctor" className="text-xs text-slate-400 font-medium">
              Doctor:
            </label>
            <select
              id="filter-doctor"
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setPage(1);
              }}
              className="form-input py-1.5 px-3 text-xs w-auto min-h-[38px] max-w-xs"
            >
              <option value="all">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization || d.department || 'Clinical'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="bg-rose-950/60 border border-rose-500/40 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Appointments List / Table */}
      <section aria-label="Appointments Table" className="card-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400" role="status">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Retrieving real appointments from database...</p>
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments found"
            message="No appointments match your active search filters. Try clearing filters or schedule a new appointment."
            actionLabel="Book New Slot"
            onAction={() => setIsBookModalOpen(true)}
            actionIcon={Plus}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Patient</th>
                  <th scope="col" className="py-3.5 px-5">Doctor & Specialty</th>
                  <th scope="col" className="py-3.5 px-5">Slot Time</th>
                  <th scope="col" className="py-3.5 px-5">Status</th>
                  <th scope="col" className="py-3.5 px-5">Voice Verification</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {appointments.map((appt) => {
                  const { date, time } = formatSlotTime(appt.slot_time);
                  const patientName = appt.patient?.name || 'Patient';
                  const patientPhone = appt.patient?.phone || 'N/A';
                  const doctorName = appt.doctor?.name || `Doctor #${appt.doctor_id}`;
                  const department = appt.doctor?.specialization || appt.doctor?.department || 'Clinical';

                  return (
                    <tr key={appt.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-white">{patientName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" aria-hidden="true" />
                          <span>{patientPhone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-200">{doctorName}</div>
                        <div className="text-xs text-primary-400">{department}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>{date}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>{time}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="py-3.5 px-5">
                        {appt.confirmed_via_call ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" /> Pending Call
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status !== 'cancelled' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAppt(appt);
                                  setIsRescheduleModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amber-500"
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelDialogAppt(appt)}
                                className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition focus-visible:ring-2 focus-visible:ring-rose-500"
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
          <div className="p-4 border-t border-slate-800">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </section>

      {/* Book New Appointment Modal */}
      <Modal
        open={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setActionError('');
        }}
        title="Book New Appointment"
        description="Select a doctor and available consultation slot. Phone numbers will be registered for automated voice confirmations."
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          {actionError && (
            <div role="alert" className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label htmlFor="book-patient-name" className="block text-xs font-medium text-slate-300 mb-1">
              Patient Full Name
            </label>
            <input
              id="book-patient-name"
              type="text"
              required
              placeholder="e.g. Muhammad Ali"
              value={bookingForm.patientName}
              onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="book-patient-phone" className="block text-xs font-medium text-slate-300 mb-1">
              WhatsApp / Mobile Phone (Pakistan: +92 / 03xx)
            </label>
            <input
              id="book-patient-phone"
              type="text"
              required
              placeholder="+923001234567 or 03001234567"
              value={bookingForm.patientPhone}
              onChange={(e) => setBookingForm({ ...bookingForm, patientPhone: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="book-doctor" className="block text-xs font-medium text-slate-300 mb-1">
              Select Doctor
            </label>
            <select
              id="book-doctor"
              required
              value={bookingForm.doctorId}
              onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
              className="form-input"
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.department || d.specialization || 'Clinical'} ({d.start_time?.slice(0, 5) || '09:00'} - {d.end_time?.slice(0, 5) || '17:00'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="book-date" className="block text-xs font-medium text-slate-300 mb-1">
                Date
              </label>
              <input
                id="book-date"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={bookingForm.slotDate}
                onChange={(e) => setBookingForm({ ...bookingForm, slotDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="book-time" className="block text-xs font-medium text-slate-300 mb-1">
                Time (30m Slots)
              </label>
              <select
                id="book-time"
                value={bookingForm.slotTime}
                onChange={(e) => setBookingForm({ ...bookingForm, slotTime: e.target.value })}
                className="form-input"
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="book-notes" className="block text-xs font-medium text-slate-300 mb-1">
              Consultation Reason / Notes (Optional)
            </label>
            <textarea
              id="book-notes"
              rows={2}
              placeholder="e.g. Regular blood pressure checkup..."
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsBookModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={actionLoading}
            >
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        open={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setSelectedAppt(null);
          setActionError('');
        }}
        title={`Reschedule Appointment #${selectedAppt?.id || ''}`}
        description="Select a new date and consultation slot for this patient."
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          {actionError && (
            <div role="alert" className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="text-xs text-slate-300 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            Current Booking: <strong className="text-white">{selectedAppt?.patient?.name}</strong> with <strong className="text-white">{selectedAppt?.doctor?.name}</strong> on{' '}
            {selectedAppt && formatSlotTime(selectedAppt.slot_time).date} at {selectedAppt && formatSlotTime(selectedAppt.slot_time).time}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="resched-date" className="block text-xs font-medium text-slate-300 mb-1">
                New Date
              </label>
              <input
                id="resched-date"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleForm.slotDate}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, slotDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="resched-time" className="block text-xs font-medium text-slate-300 mb-1">
                New Slot Time
              </label>
              <select
                id="resched-time"
                value={rescheduleForm.slotTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, slotTime: e.target.value })}
                className="form-input"
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="resched-reason" className="block text-xs font-medium text-slate-300 mb-1">
              Reason for Reschedule
            </label>
            <input
              id="resched-reason"
              type="text"
              placeholder="e.g. Patient requested morning slot via WhatsApp"
              value={rescheduleForm.reason}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={actionLoading}
            >
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(cancelDialogAppt)}
        onClose={() => setCancelDialogAppt(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel the appointment for ${cancelDialogAppt?.patient?.name} on ${cancelDialogAppt && formatSlotTime(cancelDialogAppt.slot_time).date}? This will release the doctor's slot.`}
        confirmText="Yes, Cancel Slot"
        danger={true}
      />
    </div>
  );
}
