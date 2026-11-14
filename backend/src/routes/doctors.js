// src/routes/doctors.js — Doctors Directory & Scheduling API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth, requireRole } = require('../middleware/auth');
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
 * POST /api/doctors — Create doctor (Admin only)
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    let { name, department, department_id, fee, available_days, start_time, end_time, slot_duration_minutes } = req.body;
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

    const { data: created, error } = await db.from('doctors').insert({
      name,
      department,
      department_id: department_id || null,
      fee: fee || 500,
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

module.exports = router;
