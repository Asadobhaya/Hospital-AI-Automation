// src/pages/Patients.jsx — Patient Directory & Medical History (Medical Blue & White)
import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  FileText,
  Clock,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  RefreshCw,
  X,
  CheckCircle,
} from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { patientsAPI } from '../services/api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    is_active: true,
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: '15',
        ...(searchTerm && { search: searchTerm }),
      };
      const res = await patientsAPI.list(params);
      setPatients(res?.data || res || []);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
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
      const res = await patientsAPI.getById(patient.id);
      setPatientHistory(res?.data || res || {});
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingPatientId(null);
    setPatientForm({
      name: '',
      phone: '',
      email: '',
      gender: 'male',
      is_active: true,
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (patient) => {
    setModalMode('edit');
    setEditingPatientId(patient.id);
    setPatientForm({
      name: patient.name || '',
      phone: patient.phone || '',
      email: patient.email || '',
      gender: patient.gender || 'male',
      is_active: patient.is_active !== undefined ? patient.is_active : true,
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmitPatient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      let rawPhone = patientForm.phone.trim();
      if (!patientForm.name.trim()) {
        throw new Error('Patient full name is required.');
      }
      if (!rawPhone) {
        throw new Error('Phone number is required.');
      }

      // Format to Pakistani standard if applicable
      if (rawPhone.startsWith('03') && rawPhone.length === 11) {
        rawPhone = '+92' + rawPhone.slice(1);
      } else if (rawPhone.startsWith('923') && rawPhone.length === 12) {
        rawPhone = '+' + rawPhone;
      }

      const payload = {
        name: patientForm.name.trim(),
        phone: rawPhone,
        email: patientForm.email.trim() || undefined,
        gender: patientForm.gender,
        is_active: patientForm.is_active,
      };

      if (modalMode === 'create') {
        const res = await patientsAPI.create(payload);
        setFormSuccess('Patient registered successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchPatients();
        }, 600);
      } else {
        const res = await patientsAPI.update(editingPatientId, payload);
        setFormSuccess('Patient record updated successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchPatients();
        }, 600);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save patient record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">Patient Directory</h1>
          <p className="text-sm text-[#617181] mt-1">
            Verified patient records, contact identifiers & longitudinal visit history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchPatients}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenCreateModal}
          >
            Register Patient
          </Button>
        </div>
      </header>

      {/* Search Input */}
      <section
        aria-label="Search patients"
        className="card-surface p-4 rounded-2xl flex items-center"
      >
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8898AA]" aria-hidden="true" />
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
          <div className="p-12 text-center text-[#617181]" role="status">
            <div className="inline-block w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mb-3" />
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
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#DFE6EE] bg-[#F5F8FC] text-xs font-semibold text-[#172B3A] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Patient Name</th>
                  <th scope="col" className="py-3.5 px-5">Phone Number</th>
                  <th scope="col" className="py-3.5 px-5">Last Inbound Contact</th>
                  <th scope="col" className="py-3.5 px-5">Clinical Status</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE6EE] text-sm">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-[#EDF4FB] transition">
                    <td className="py-3.5 px-5 font-semibold text-[#172B3A] flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full bg-[#E7F1FB] text-[#2F78C8] border border-[#DFE6EE] flex items-center justify-center font-bold text-xs shrink-0"
                        aria-hidden="true"
                      >
                        {(p.name || 'P').charAt(0)}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#617181] font-mono text-xs">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#617181]">
                      {p.last_message_at ? new Date(p.last_message_at).toLocaleString() : 'Registered via Portal'}
                    </td>
                    <td className="py-3.5 px-5">
                      {p.is_active !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20">
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF2D8] text-[#8A4B08] border border-[#8A4B08]/20">
                          <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEditModal(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPatientHistory(p)}
                        >
                          View History
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#DFE6EE]">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </section>

      {/* Add / Edit Patient Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Register New Patient' : 'Edit Patient Information'}
        description="Save patient demographics and verified Pakistani contact information."
        size="md"
      >
        <form onSubmit={handleSubmitPatient} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#FDECEC] text-[#B42318] text-xs rounded-xl border border-[#B42318]/20">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-[#E7F5EC] text-[#18794E] text-xs rounded-xl border border-[#18794E]/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Asad Ullah"
              value={patientForm.name}
              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-1.5">
              WhatsApp / Mobile Phone (Pakistan: 03xx or +923xx) *
            </label>
            <input
              type="text"
              required
              placeholder="03004634494 or +923004634494"
              value={patientForm.phone}
              onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
              className="form-input font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                className="form-input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#172B3A] cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={patientForm.is_active}
                onChange={(e) => setPatientForm({ ...patientForm, is_active: e.target.checked })}
                className="rounded border-[#DFE6EE] text-[#2F78C8] focus:ring-[#175DB5]"
              />
              <span>Patient Account Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DFE6EE]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {modalMode === 'create' ? 'Register Patient' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

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
          <div className="p-10 text-center text-[#617181]" role="status">
            <div className="w-6 h-6 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Fetching clinical history...</p>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="p-3.5 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE] flex flex-wrap justify-between items-center gap-2 text-xs">
              <div>
                <span className="text-[#617181]">Verified Contact:</span>{' '}
                <strong className="text-[#172B3A] font-mono">{selectedPatient?.phone}</strong>
              </div>
              <div>
                <span className="text-[#617181]">Record ID:</span>{' '}
                <strong className="text-[#2F78C8] font-mono">#{selectedPatient?.id}</strong>
              </div>
            </div>

            {/* Appointments */}
            <div>
              <h3 className="text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2F78C8]" aria-hidden="true" />
                Appointment History
              </h3>
              {patientHistory?.appointments?.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.appointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE] text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-[#172B3A]">{a.doctor?.name || `Doctor #${a.doctor_id}`}</div>
                        <div className="text-[#617181] mt-0.5">{new Date(a.slot_time).toLocaleString()}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8898AA] italic p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE]">
                  No appointments recorded for this patient.
                </p>
              )}
            </div>

            {/* Diagnostic Reports */}
            <div>
              <h3 className="text-xs font-semibold text-[#172B3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#2458A6]" aria-hidden="true" />
                Diagnostic Lab Reports
              </h3>
              {patientHistory?.reports?.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.reports.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE] text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-[#172B3A]">{r.report_type}</div>
                        <div className="text-[#617181] mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <StatusBadge status={r.is_critical ? 'critical' : 'normal'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8898AA] italic p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE]">
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
