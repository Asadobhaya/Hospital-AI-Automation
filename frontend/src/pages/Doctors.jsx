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
  XCircle,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import Modal from '../components/Modal';

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
    slotDurationMinutes: '30'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, deptsRes] = await Promise.all([
        fetch('/api/doctors', { credentials: 'include' }),
        fetch('/api/departments', { credentials: 'include' })
      ]);

      if (docsRes.ok) {
        const d = await docsRes.json();
        setDoctors(d.data || []);
      }
      if (deptsRes.ok) {
        const dep = await deptsRes.json();
        setDepartments(dep.data || []);
      }
    } catch (err) {
      console.error(err);
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
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: doctorForm.name,
          department_id: parseInt(doctorForm.departmentId, 10),
          specialization: doctorForm.specialization,
          phone: doctorForm.phone,
          email: doctorForm.email,
          start_time: doctorForm.startTime,
          end_time: doctorForm.endTime,
          slot_duration_minutes: parseInt(doctorForm.slotDurationMinutes, 10),
          available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || json.message || 'Failed to add doctor');

      setIsModalOpen(false);
      setDoctorForm({
        name: '',
        departmentId: '',
        specialization: '',
        phone: '',
        email: '',
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: '30'
      });
      fetchData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || doc.department_id?.toString() === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Physicians & Scheduling</h1>
          <p className="text-sm text-slate-400 mt-1">
            Active medical practitioners, clinical consulting hours & department rosters
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-md shadow-primary-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by physician name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading doctors roster...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-800/80 border border-slate-700/70 rounded-2xl">
          <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No doctors found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or register a new doctor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm hover:border-slate-600 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-sm">
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{doc.name}</h3>
                      <p className="text-xs text-primary-400 font-medium">{doc.specialization}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${doc.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
                    {doc.is_active ? 'On Duty' : 'Away'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hours: <strong>{doc.start_time} - {doc.end_time}</strong> ({doc.slot_duration_minutes || 30} min slots)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">
                      Days: {Array.isArray(doc.available_days) ? doc.available_days.join(', ') : 'Mon - Sat'}
                    </span>
                  </div>
                  {doc.phone && (
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5" /> {doc.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Department #{doc.department_id}</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalError(''); }}
        title="Register New Doctor"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Doctor Full Name</label>
            <input
              type="text"
              required
              placeholder="Dr. Rajesh Gupta"
              value={doctorForm.name}
              onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
              <select
                required
                value={doctorForm.departmentId}
                onChange={(e) => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Specialization</label>
              <input
                type="text"
                required
                placeholder="Senior Cardiologist"
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shift Start Time</label>
              <input
                type="time"
                required
                value={doctorForm.startTime}
                onChange={(e) => setDoctorForm({ ...doctorForm, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shift End Time</label>
              <input
                type="time"
                required
                value={doctorForm.endTime}
                onChange={(e) => setDoctorForm({ ...doctorForm, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
              {submitting ? 'Saving...' : 'Save Doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
