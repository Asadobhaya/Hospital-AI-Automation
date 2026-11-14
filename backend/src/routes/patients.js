// src/routes/patients.js — Patient Records API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const response = require('../utils/response');

/**
 * GET /api/patients — Searchable patient list with pagination
 */
router.get('/', requireAuth, async (req, res, next) => {
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
 * GET /api/patients/:id — Patient detail with appointments and reports history
 */
router.get('/:id', requireAuth, async (req, res, next) => {
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
