// src/routes/appointments.js — Appointment Management API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth, requireRole, enforceOwnership } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const appointmentService = require('../services/appointmentService');
const response = require('../utils/response');

/**
 * GET /api/appointments — Filterable, searchable list with pagination
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { status, doctor_id, search, date } = req.query;

    let query = db.from('appointments').select('*').order('slot_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (doctor_id) {
      query = query.eq('doctor_id', parseInt(doctor_id, 10));
    }

    const { data: allRows } = await query;
    let filtered = allRows || [];

    // Filter by date (YYYY-MM-DD)
    if (date) {
      filtered = filtered.filter((a) => a.slot_time && a.slot_time.startsWith(date));
    }

    // Search by patient name or phone
    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((a) => {
        const patientName = a.patient?.name?.toLowerCase() || '';
        const patientPhone = a.patient?.phone?.toLowerCase() || '';
        const doctorName = a.doctor?.name?.toLowerCase() || '';
        return patientName.includes(q) || patientPhone.includes(q) || doctorName.includes(q);
      });
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return response.success(res, paginated, 200, response.buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/appointments/:id — Secure detail view with IDOR ownership check
 */
router.get('/:id', requireAuth, enforceOwnership('appointments'), async (req, res, next) => {
  try {
    const appointment = req.resource || await db.from('appointments').select('*').eq('id', parseInt(req.params.id, 10)).single().then(r => r.data);
    if (!appointment) {
      return response.error(res, 'Appointment not found.', 404);
    }
    return response.success(res, appointment);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/appointments — Book an appointment with strict schema validation
 */
router.post('/', requireAuth, validateBody(schemas.bookAppointment), async (req, res, next) => {
  try {
    const { patientPhone, patientName, doctorId, slotTime, source, notes } = req.body;

    const result = await appointmentService.bookAppointment({
      patientPhone,
      patientName,
      doctorId: parseInt(doctorId, 10),
      slotTime,
      source: source || 'dashboard',
      notes,
      userId: req.user.id,
      ip: req.ip,
    });

    return response.success(res, result, 201);
  } catch (err) {
    return response.error(res, err.message, 400);
  }
});

/**
 * POST / PATCH /api/appointments/:id/reschedule — Reschedule slot with IDOR check
 */
router.all('/:id/reschedule', requireAuth, enforceOwnership('appointments'), validateBody(schemas.rescheduleAppointment), async (req, res, next) => {
  if (req.method !== 'POST' && req.method !== 'PATCH') return next();
  try {
    const id = parseInt(req.params.id, 10);
    const { newSlotTime } = req.body;

    const updated = await appointmentService.rescheduleAppointment(id, newSlotTime, {
      userId: req.user.id,
      ip: req.ip,
    });

    return response.success(res, updated);
  } catch (err) {
    return response.error(res, err.message, 400);
  }
});

/**
 * POST / PATCH /api/appointments/:id/cancel — Cancel appointment with IDOR check
 */
router.all('/:id/cancel', requireAuth, enforceOwnership('appointments'), async (req, res, next) => {
  if (req.method !== 'POST' && req.method !== 'PATCH') return next();
  try {
    const id = parseInt(req.params.id, 10);
    const { reason } = req.body;

    const cancelled = await appointmentService.cancelAppointment(id, {
      reason,
      userId: req.user.id,
      ip: req.ip,
    });

    return response.success(res, cancelled);
  } catch (err) {
    return response.error(res, err.message, 400);
  }
});

/**
 * PATCH /api/appointments/:id/status — Update status (e.g. mark completed)
 */
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const allowed = ['confirmed', 'completed', 'cancelled', 'missed', 'reschedule_pending', 'no_show'];

    if (!allowed.includes(status)) {
      return response.error(res, `Invalid status. Must be one of: ${allowed.join(', ')}`, 400);
    }

    const updates = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await db.from('appointments').update(updates).eq('id', id);
    if (error) return response.error(res, error.message, 400);

    return response.success(res, updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
