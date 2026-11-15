// src/routes/doctors.js — Doctors Directory & Scheduling API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const response = require('../utils/response');

/**
 * GET /api/doctors
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { department_id } = req.query;
    let query = db.from('doctors').select('*').order('name', { ascending: true });

    if (department_id) {
      query = query.eq('department_id', parseInt(department_id, 10));
    }

    const { data: doctors } = await query;
    return response.success(res, doctors || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/doctors/:id
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: doctor } = await db.from('doctors').select('*').eq('id', id).single();
    if (!doctor) return response.error(res, 'Doctor not found.', 404);
    return response.success(res, doctor);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/doctors — Create doctor (Admin only, strictly validated)
 */
router.post('/', requireAuth, requireRole('admin'), validateBody(schemas.createDoctor), async (req, res, next) => {
  try {
    let { name, department, department_id, fee, phone, email, qualification, available_days, start_time, end_time, slot_duration_minutes } = req.body;
    if (!name) {
      return response.error(res, 'Name is required.', 400);
    }

    if (!department && department_id) {
      try {
        const { data: dept } = await db.from('departments').select('name').eq('id', department_id).single();
        if (dept && dept.name) department = dept.name;
      } catch {
        department = null;
      }
    }
    if (!department) department = 'General Medicine';

    // Format phone to E.164 if Pakistani
    let formattedPhone = phone ? String(phone).replace(/[\s\-\(\)]/g, '').trim() : null;
    if (formattedPhone && formattedPhone.startsWith('03') && formattedPhone.length === 11) {
      formattedPhone = '+92' + formattedPhone.slice(1);
    } else if (formattedPhone && formattedPhone.startsWith('923') && formattedPhone.length === 12) {
      formattedPhone = '+' + formattedPhone;
    }

    const { data: created, error } = await db.from('doctors').insert({
      name,
      department,
      department_id: department_id || null,
      fee: fee || 500,
      phone: formattedPhone || null,
      email: email ? email.trim() : null,
      qualification: qualification ? qualification.trim() : null,
      available_days: available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      start_time: start_time || '09:00',
      end_time: end_time || '17:00',
      slot_duration_minutes: slot_duration_minutes || 30,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    if (error) return response.error(res, error.message, 400);
    return response.success(res, created, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/doctors/:id — Update doctor (Admin only)
 */
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: existing } = await db.from('doctors').select('*').eq('id', id).single();
    if (!existing) {
      return response.error(res, 'Doctor not found.', 404);
    }

    const { name, department, department_id, fee, phone, email, qualification, available_days, start_time, end_time, slot_duration_minutes, is_active } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (department) updates.department = department.trim();
    if (department_id) updates.department_id = parseInt(department_id, 10);
    if (fee !== undefined) updates.fee = Number(fee);
    if (phone !== undefined) {
      let formattedPhone = phone ? String(phone).replace(/[\s\-\(\)]/g, '').trim() : null;
      if (formattedPhone && formattedPhone.startsWith('03') && formattedPhone.length === 11) {
        formattedPhone = '+92' + formattedPhone.slice(1);
      } else if (formattedPhone && formattedPhone.startsWith('923') && formattedPhone.length === 12) {
        formattedPhone = '+' + formattedPhone;
      }
      updates.phone = formattedPhone;
    }
    if (email !== undefined) updates.email = email ? email.trim() : null;
    if (qualification !== undefined) updates.qualification = qualification ? qualification.trim() : null;
    if (available_days) updates.available_days = available_days;
    if (start_time) updates.start_time = start_time;
    if (end_time) updates.end_time = end_time;
    if (slot_duration_minutes) updates.slot_duration_minutes = parseInt(slot_duration_minutes, 10);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await db.from('doctors').update(updates).eq('id', id);
    if (error) return response.error(res, error.message, 400);
    return response.success(res, Array.isArray(updated) ? updated[0] : updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/doctors/:id — Remove doctor (Admin only)
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: existing } = await db.from('doctors').select('*').eq('id', id).single();
    if (!existing) {
      return response.error(res, 'Doctor not found.', 404);
    }
    const { error } = await db.from('doctors').delete().eq('id', id);
    if (error) return response.error(res, error.message, 400);
    return response.success(res, { message: 'Doctor deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
