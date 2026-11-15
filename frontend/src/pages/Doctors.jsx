// src/pages/Doctors.jsx — Doctor Directory & Schedule Configuration (Medical Blue & White)
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
  Edit2,
  Trash2,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { doctorsAPI, departmentsAPI } from '../services/api';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Add / Edit Doctor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteDialogDoc, setDeleteDialogDoc] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const handleOpenCreateDoctor = () => {
    setModalMode('create');
    setEditingDoctorId(null);
    setDoctorForm({
      name: '',
      departmentId: departments[0]?.id ? String(departments[0].id) : '1',
      specialization: '',
      phone: '',
      email: '',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: '30',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setModalMode('edit');
    setEditingDoctorId(doc.id);
    setDoctorForm({
      name: doc.name || '',
      departmentId: doc.department_id ? String(doc.department_id) : '',
      specialization: doc.qualification || doc.specialization || '',
      phone: doc.phone || '',
      email: doc.email || '',
      startTime: doc.start_time || '09:00',
      endTime: doc.end_time || '17:00',
      slotDurationMinutes: doc.slot_duration_minutes ? String(doc.slot_duration_minutes) : '30',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmitDoctor = async (e) => {
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
        let cleanPhone = doctorForm.phone.replace(/[\s\-\(\)]/g, '').trim();
        if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
          cleanPhone = '+92' + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith('923') && cleanPhone.length === 12) {
          cleanPhone = '+' + cleanPhone;
        }
        payload.phone = cleanPhone;
      }
      if (doctorForm.email && doctorForm.email.trim()) {
        payload.email = doctorForm.email.trim();
      }

      if (modalMode === 'create') {
        await doctorsAPI.create(payload);
      } else {
        await doctorsAPI.update(editingDoctorId, payload);
      }

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
      setModalError(err?.message || 'Failed to save physician record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!deleteDialogDoc) return;
    try {
      setDeleteLoading(true);
      await doctorsAPI.delete(deleteDialogDoc.id);
      setDeleteDialogDoc(null);
      fetchData();
    } catch (err) {
      alert(err?.message || 'Failed to remove physician.');
    } finally {
      setDeleteLoading(false);
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
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">Physicians & Scheduling</h1>
          <p className="text-sm text-[#617181] mt-1">
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
            onClick={handleOpenCreateDoctor}
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
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8898AA]" aria-hidden="true" />
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
          <label htmlFor="dept-filter" className="text-xs text-[#617181] font-semibold">
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
        <div className="p-12 text-center text-[#617181]" role="status">
          <div className="w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
                      className="w-11 h-11 rounded-xl bg-[#E7F1FB] text-[#2F78C8] border border-[#DFE6EE] flex items-center justify-center font-bold text-sm"
                      aria-hidden="true"
                    >
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#172B3A] text-base tracking-tight">{doc.name}</h2>
                      <p className="text-xs text-[#2F78C8] font-semibold">{doc.specialization || 'Clinical Specialist'}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      doc.is_active
                        ? 'bg-[#E7F5EC] text-[#18794E] border-[#18794E]/30'
                        : 'bg-[#F5F8FC] text-[#617181] border-[#DFE6EE]'
                    }`}
                  >
                    {doc.is_active ? 'On Duty' : 'Away'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[#4B5D6B]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#617181] shrink-0" aria-hidden="true" />
                    <span>
                      Hours: <strong className="text-[#172B3A]">{doc.start_time} - {doc.end_time}</strong> ({doc.slot_duration_minutes || 30}m slots)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#617181] shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      Days: {Array.isArray(doc.available_days) ? doc.available_days.join(', ') : 'Mon - Sat'}
                    </span>
                  </div>
                  {doc.phone && (
                    <div className="flex items-center gap-2 text-[#617181] font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-[#8898AA] shrink-0" aria-hidden="true" />
                      <span>{doc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#DFE6EE] flex items-center justify-between text-xs">
                <span className="text-[#617181]">Department #{doc.department_id || 'General'}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditDoctor(doc)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#B42318] hover:bg-[#FDECEC]"
                    icon={Trash2}
                    onClick={() => setDeleteDialogDoc(doc)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Add / Edit Doctor Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError('');
        }}
        title={modalMode === 'create' ? 'Register New Doctor' : 'Edit Physician Profile'}
        description={
          modalMode === 'create'
            ? 'Add a physician to the hospital management system and configure clinical availability hours.'
            : 'Update physician consulting hours, contact details, or clinical specialty.'
        }
      >
        <form onSubmit={handleSubmitDoctor} className="space-y-4">
          {modalError && (
            <div role="alert" className="p-3 bg-[#FDECEC] border border-[#B42318]/30 rounded-xl text-[#B42318] text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label htmlFor="doc-name" className="block text-xs font-semibold text-[#172B3A] mb-1">
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
              <label htmlFor="doc-dept" className="block text-xs font-semibold text-[#172B3A] mb-1">
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
              <label htmlFor="doc-spec" className="block text-xs font-semibold text-[#172B3A] mb-1">
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
              <label htmlFor="doc-phone" className="block text-xs font-semibold text-[#172B3A] mb-1">
                Doctor Phone (Pakistan: +92 / 03xx)
              </label>
              <input
                id="doc-phone"
                type="text"
                placeholder="+923001234567"
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="doc-email" className="block text-xs font-semibold text-[#172B3A] mb-1">
                Doctor Email
              </label>
              <input
                id="doc-email"
                type="email"
                placeholder="doctor@hospital.test"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-start" className="block text-xs font-semibold text-[#172B3A] mb-1">
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
              <label htmlFor="doc-end" className="block text-xs font-semibold text-[#172B3A] mb-1">
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
              Save Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Doctor Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteDialogDoc)}
        title="Remove Physician from Clinical Roster"
        message={`Are you sure you want to remove ${deleteDialogDoc?.name}? This physician will no longer appear in appointment booking and scheduling rosters.`}
        confirmText="Remove Physician"
        cancelText="Keep Physician"
        danger={true}
        loading={deleteLoading}
        onConfirm={handleDeleteDoctor}
        onClose={() => setDeleteDialogDoc(null)}
      />
    </div>
  );
}
