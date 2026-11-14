// src/pages/Doctors.jsx — Doctor Directory & Schedule Configuration
import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Clock,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Phone,
} from 'lucide-react';
import Modal from '../components/Modal';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { doctorsAPI, departmentsAPI } from '../services/api';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Add Doctor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    departmentId: '',
    specialization: '',
    phone: '',
    email: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: '30',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, deptsRes] = await Promise.all([
        doctorsAPI.list(),
        departmentsAPI.list(),
      ]);

      setDoctors(docsRes?.data || docsRes || []);
      setDepartments(deptsRes?.data || deptsRes || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const selectedDeptObj = departments.find(
        (d) => String(d.id) === String(doctorForm.departmentId)
      );
      const payload = {
        name: doctorForm.name.trim(),
        department: selectedDeptObj ? selectedDeptObj.name : 'General Medicine',
        qualification: doctorForm.specialization?.trim() || undefined,
        start_time: doctorForm.startTime || '09:00',
        end_time: doctorForm.endTime || '17:00',
        slot_duration_minutes: parseInt(doctorForm.slotDurationMinutes, 10) || 30,
        available_days: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
      };
      if (doctorForm.departmentId) {
        payload.department_id = parseInt(doctorForm.departmentId, 10);
      }
      if (doctorForm.phone && doctorForm.phone.trim()) {
        payload.phone = doctorForm.phone.trim();
      }
      if (doctorForm.email && doctorForm.email.trim()) {
        payload.email = doctorForm.email.trim();
      }

      await doctorsAPI.create(payload);

      setIsModalOpen(false);
      setDoctorForm({
        name: '',
        departmentId: '',
        specialization: '',
        phone: '',
        email: '',
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: '30',
      });
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to register doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDept === 'all' || doc.department_id?.toString() === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Physicians & Scheduling</h1>
          <p className="text-sm text-slate-400 mt-1">
            Active medical practitioners, clinical consulting hours & department rosters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon={Plus}
          >
            Add Doctor
          </Button>
        </div>
      </header>

      {/* Filter and Search */}
      <section
        aria-label="Filter physicians"
        className="card-surface p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center"
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="doctor-search"
            type="text"
            placeholder="Search by physician name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
            aria-label="Search doctors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="dept-filter" className="text-xs text-slate-400 font-medium">
            Department:
          </label>
          <select
            id="dept-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="form-input py-1.5 px-3 text-xs w-auto min-h-[38px]"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400" role="status">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading doctors roster...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          message="No physicians match your filter criteria. Register a doctor to populate the clinical roster."
          actionLabel="Register Doctor"
          onAction={() => setIsModalOpen(true)}
          actionIcon={Plus}
        />
      ) : (
        <section aria-label="Doctors Roster" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <article
              key={doc.id}
              className="card-surface p-5 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-sm"
                      aria-hidden="true"
                    >
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-base tracking-tight">{doc.name}</h2>
                      <p className="text-xs text-primary-400 font-medium">{doc.specialization || 'Clinical Specialist'}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      doc.is_active
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {doc.is_active ? 'On Duty' : 'Away'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>
                      Hours: <strong className="text-white">{doc.start_time} - {doc.end_time}</strong> ({doc.slot_duration_minutes || 30}m slots)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      Days: {Array.isArray(doc.available_days) ? doc.available_days.join(', ') : 'Mon - Sat'}
                    </span>
                  </div>
                  {doc.phone && (
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      <span>{doc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Department #{doc.department_id || 'General'}</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Verified Staff
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Add Doctor Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError('');
        }}
        title="Register New Doctor"
        description="Add a physician to the hospital management system and configure clinical availability hours."
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          {modalError && (
            <div role="alert" className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label htmlFor="doc-name" className="block text-xs font-medium text-slate-300 mb-1">
              Doctor Full Name
            </label>
            <input
              id="doc-name"
              type="text"
              required
              placeholder="Dr. Muhammad Tariq"
              value={doctorForm.name}
              onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-dept" className="block text-xs font-medium text-slate-300 mb-1">
                Department
              </label>
              <select
                id="doc-dept"
                required
                value={doctorForm.departmentId}
                onChange={(e) => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}
                className="form-input"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="doc-spec" className="block text-xs font-medium text-slate-300 mb-1">
                Specialization / Qualification
              </label>
              <input
                id="doc-spec"
                type="text"
                required
                placeholder="Senior Cardiologist"
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-start" className="block text-xs font-medium text-slate-300 mb-1">
                Shift Start Time
              </label>
              <input
                id="doc-start"
                type="time"
                required
                value={doctorForm.startTime}
                onChange={(e) => setDoctorForm({ ...doctorForm, startTime: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="doc-end" className="block text-xs font-medium text-slate-300 mb-1">
                Shift End Time
              </label>
              <input
                id="doc-end"
                type="time"
                required
                value={doctorForm.endTime}
                onChange={(e) => setDoctorForm({ ...doctorForm, endTime: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
              Save Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
