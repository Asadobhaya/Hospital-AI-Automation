// src/routes/patients.js — Patient Records API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth, requireRole, enforceOwnership } = require('../middleware/auth');
const { scrapingProtectionLimiter } = require('../middleware/rateLimiter');
const { validateBody, schemas } = require('../middleware/validation');
const response = require('../utils/response');

/**
 * GET /api/patients — Searchable patient list with anti-scraping rate limiter
 */
router.get('/', requireAuth, scrapingProtectionLimiter, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const search = (req.query.search || '').trim().toLowerCase();

    const { data: allPatients } = await db.from('patients').select('*').order('created_at', { ascending: false });
    let filtered = allPatients || [];

    if (search) {
      filtered = filtered.filter((p) => {
        return (p.name && p.name.toLowerCase().includes(search)) || (p.phone && p.phone.includes(search));
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
 * GET /api/patients/:id — Patient detail with IDOR ownership check
 */
router.get('/:id', requireAuth, enforceOwnership('patients', 'id', 'id'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: patient } = await db.from('patients').select('*').eq('id', id).single();
    if (!patient) {
      return response.error(res, 'Patient not found.', 404);
    }

    // Load related appointments
    const { data: appointments } = await db.from('appointments').select('*').eq('patient_id', id).order('slot_time', { ascending: false });

    // Load related reports (without leaking secret tokens if role is receptionist/viewer)
    const { data: rawReports } = await db.from('reports').select('*').eq('patient_id', id).order('created_at', { ascending: false });
    const reports = (rawReports || []).map((r) => ({
      id: r.id,
      report_type: r.report_type,
      is_critical: r.is_critical,
      created_at: r.created_at,
      expires_at: r.expires_at,
      is_revoked: r.is_revoked,
      access_count: r.access_count,
    }));

    return response.success(res, {
      ...patient,
      appointments: appointments || [],
      reports,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/patients — Register new patient
 */
router.post('/', requireAuth, validateBody(schemas.createPatient), async (req, res, next) => {
  try {
    let { name, phone, email, gender, is_active } = req.body;
    name = (name || '').trim();
    phone = (phone || '').trim();
    if (!name || !phone) {
      return response.error(res, 'Patient name and phone number are required.', 400);
    }

    // Format phone to E.164 if Pakistani
    if (phone.startsWith('03') && phone.length === 11) {
      phone = '+92' + phone.slice(1);
    } else if (phone.startsWith('923') && phone.length === 12) {
      phone = '+' + phone;
    }

    const newPatient = {
      name,
      phone,
      email: email ? email.trim() : null,
      gender: gender || 'other',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    };

    const { data: created, error } = await db.from('patients').insert(newPatient);
    if (error) {
      return response.error(res, error.message || 'Failed to create patient record.', 400);
    }

    return response.success(res, created, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/patients/:id — Update patient details
 */
router.put('/:id', requireAuth, validateBody(schemas.updatePatient), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    let { name, phone, email, gender, is_active } = req.body;

    const { data: existing } = await db.from('patients').select('*').eq('id', id).single();
    if (!existing) {
      return response.error(res, 'Patient record not found.', 404);
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) {
      phone = phone.trim();
      if (phone.startsWith('03') && phone.length === 11) {
        phone = '+92' + phone.slice(1);
      } else if (phone.startsWith('923') && phone.length === 12) {
        phone = '+' + phone;
      }
      updates.phone = phone;
    }
    if (email !== undefined) updates.email = email ? email.trim() : null;
    if (gender !== undefined) updates.gender = gender;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await db.from('patients').update(updates).eq('id', id);
    if (error) {
      return response.error(res, error.message || 'Failed to update patient record.', 400);
    }

    return response.success(res, Array.isArray(updated) ? updated[0] : updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/patients/:id — Remove patient record (Admin only)
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: existing } = await db.from('patients').select('*').eq('id', id).single();
    if (!existing) {
      return response.error(res, 'Patient record not found.', 404);
    }

    const { error } = await db.from('patients').delete().eq('id', id);
    if (error) return response.error(res, error.message, 400);

    return response.success(res, { message: 'Patient record deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patients/:id/appointments
 */
router.get('/:id/appointments', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: appointments } = await db.from('appointments').select('*').eq('patient_id', id).order('slot_time', { ascending: false });
    return response.success(res, appointments || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patients/:id/reports
 */
router.get('/:id/reports', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: reports } = await db.from('reports').select('*').eq('patient_id', id).order('created_at', { ascending: false });
    return response.success(res, reports || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patients/:id/feedback
 */
router.get('/:id/feedback', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data: feedback } = await db.from('feedback').select('*').eq('patient_id', id).order('created_at', { ascending: false });
    return response.success(res, feedback || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
