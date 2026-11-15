// src/services/appointmentService.js — Core Appointment Business Logic
'use strict';

const db = require('../db/dbAdapter');
const { logAction } = require('./auditService');

/**
 * Validate doctor schedule and slot availability
 */
async function validateSlot(doctorId, slotTimeStr) {
  const slotDate = new Date(slotTimeStr);
  if (isNaN(slotDate.getTime())) {
    throw new Error('Invalid slot_time format. Must be an ISO 8601 date string.');
  }

  // Prevent booking in the past
  if (slotDate.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new Error('Cannot book an appointment in the past.');
  }

  // Fetch doctor details
  const { data: doctor } = await db.from('doctors').select('*').eq('id', doctorId).single();
  if (!doctor || !doctor.is_active) {
    throw new Error('Selected doctor is not available or does not exist.');
  }

  // Check doctor available days (e.g. Monday, Tuesday)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const candidateDays = new Set();
  candidateDays.add(dayNames[slotDate.getDay()]);
  candidateDays.add(dayNames[slotDate.getUTCDay()]);
  if (typeof slotTimeStr === 'string' && slotTimeStr.includes('-')) {
    const datePart = slotTimeStr.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      candidateDays.add(dayNames[new Date(y, m - 1, d, 12, 0, 0).getDay()]);
    }
  }

  if (Array.isArray(doctor.available_days) && doctor.available_days.length > 0) {
    const hasMatchingDay = Array.from(candidateDays).some((day) => doctor.available_days.includes(day));
    if (!hasMatchingDay) {
      const primaryDay = dayNames[slotDate.getDay()];
      throw new Error(`Doctor ${doctor.name} is not available on ${primaryDay}s. Available days: ${doctor.available_days.join(', ')}.`);
    }
  }

  // Check working hours: resilient across local machine timezone, UTC, and raw ISO representation
  if (doctor.start_time && doctor.end_time) {
    const candidateTimes = [];
    if (typeof slotTimeStr === 'string' && slotTimeStr.includes('T')) {
      candidateTimes.push(slotTimeStr.split('T')[1].slice(0, 5));
    }
    candidateTimes.push(`${slotDate.getHours().toString().padStart(2, '0')}:${slotDate.getMinutes().toString().padStart(2, '0')}`);
    candidateTimes.push(`${slotDate.getUTCHours().toString().padStart(2, '0')}:${slotDate.getUTCMinutes().toString().padStart(2, '0')}`);

    const isWithinHours = candidateTimes.some((t) => t >= doctor.start_time && t <= doctor.end_time);
    if (!isWithinHours) {
      const displayTime = candidateTimes[0] || `${slotDate.getHours()}:${slotDate.getMinutes()}`;
      throw new Error(`Appointment time ${displayTime} is outside doctor's consulting hours (${doctor.start_time} - ${doctor.end_time}).`);
    }
  }

  // Check double-booking at database level
  const { data: existingAppts } = await db
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctorId)
    .neq('status', 'cancelled');

  const conflict = (existingAppts || []).find((a) => {
    return Math.abs(new Date(a.slot_time).getTime() - slotDate.getTime()) < (doctor.slot_duration_minutes || 30) * 60 * 1000;
  });

  if (conflict) {
    throw new Error(`Time slot conflict: Doctor ${doctor.name} already has an appointment booked at or near this time.`);
  }

  return doctor;
}

/**
 * Standardize phone number format (+92 default for Pakistani mobile numbers)
 */
function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.toString().replace(/[^\d+]/g, '');
  if (clean.startsWith('03') && clean.length === 11) {
    clean = '+92' + clean.slice(1);
  } else if (clean.startsWith('3') && clean.length === 10) {
    clean = '+92' + clean;
  } else if (clean.startsWith('92') && clean.length === 12) {
    clean = '+' + clean;
  } else if (!clean.startsWith('+')) {
    if (clean.length === 10 || clean.length === 11) clean = '+92' + clean.replace(/^0/, '');
    else clean = '+' + clean;
  }
  return clean;
}

/**
 * Book an appointment
 */
async function bookAppointment({ patientPhone, patientName, doctorId, slotTime, source = 'dashboard', notes = '', userId = null, ip = null }) {
  if (!patientPhone) throw new Error('Patient phone number is required.');
  if (!doctorId) throw new Error('Doctor ID is required.');
  if (!slotTime) throw new Error('Slot time is required.');

  const cleanPhone = normalizePhone(patientPhone);

  // Validate doctor and slot
  const doctor = await validateSlot(doctorId, slotTime);

  // Upsert or fetch patient
  let patient;
  const { data: existingPatient } = await db.from('patients').select('*').eq('phone', cleanPhone).single();
  if (existingPatient) {
    patient = existingPatient;
    if (patientName && (patient.name === 'Patient' || !patient.name)) {
      await db.from('patients').update({ name: patientName }).eq('id', patient.id);
      patient.name = patientName;
    }
  } else {
    const { data: newPatient, error: pErr } = await db.from('patients').insert({
      phone: cleanPhone,
      name: patientName || 'Patient',
      is_active: true,
      last_message_at: new Date().toISOString(),
    });
    if (pErr) throw new Error('Failed to register patient record: ' + pErr.message);
    patient = newPatient;
  }

  // Insert appointment with DB level constraint check
  const { data: appointment, error: aErr } = await db.from('appointments').insert({
    patient_id: patient.id,
    doctor_id: doctor.id,
    slot_time: new Date(slotTime).toISOString(),
    status: 'confirmed',
    source,
    notes,
    reminder_24h_sent: false,
    reminder_2h_sent: false,
    confirmed_via_call: false,
    rescheduled: false,
    feedback_sent: false,
    retry_count: 0,
    created_at: new Date().toISOString(),
  });

  if (aErr) {
    throw new Error(aErr.message || 'Failed to save appointment record.');
  }

  await logAction({
    userId,
    action: 'BOOK_APPOINTMENT',
    resourceType: 'appointment',
    resourceId: appointment.id,
    details: { patientPhone, doctorId, slotTime },
    ip,
  });

  return { appointment, patient, doctor };
}

/**
 * Reschedule an appointment
 */
async function rescheduleAppointment(appointmentId, newSlotTime, { userId = null, ip = null } = {}) {
  const { data: existing } = await db.from('appointments').select('*').eq('id', appointmentId).single();
  if (!existing) {
    throw new Error('Appointment not found.');
  }
  if (existing.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled appointment.');
  }

  // Validate new slot
  await validateSlot(existing.doctor_id, newSlotTime);

  const { data: updated, error } = await db.from('appointments').update({
    slot_time: new Date(newSlotTime).toISOString(),
    status: 'confirmed',
    rescheduled: true,
    reminder_24h_sent: false,
    reminder_2h_sent: false,
  }).eq('id', appointmentId);

  if (error) {
    throw new Error(error.message || 'Failed to reschedule appointment.');
  }

  await logAction({
    userId,
    action: 'RESCHEDULE_APPOINTMENT',
    resourceType: 'appointment',
    resourceId: appointmentId,
    details: { oldSlot: existing.slot_time, newSlot: newSlotTime },
    ip,
  });

  return updated;
}

/**
 * Cancel an appointment
 */
async function cancelAppointment(appointmentId, { reason = '', userId = null, ip = null } = {}) {
  const { data: existing } = await db.from('appointments').select('*').eq('id', appointmentId).single();
  if (!existing) {
    throw new Error('Appointment not found.');
  }

  const { data: updated, error } = await db.from('appointments').update({
    status: 'cancelled',
    notes: reason ? `${existing.notes || ''} [Cancelled: ${reason}]` : existing.notes,
  }).eq('id', appointmentId);

  if (error) throw new Error(error.message || 'Failed to cancel appointment.');

  await logAction({
    userId,
    action: 'CANCEL_APPOINTMENT',
    resourceType: 'appointment',
    resourceId: appointmentId,
    details: { reason },
    ip,
  });

  return updated;
}

module.exports = {
  normalizePhone,
  validateSlot,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
};
