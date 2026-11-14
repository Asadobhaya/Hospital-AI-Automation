// src/routes/reports.js — Diagnostic Reports Management & Public Secure Viewer
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth, requireRole } = require('../middleware/auth');
const reportService = require('../services/reportService');
const response = require('../utils/response');

/**
 * GET /api/reports — Staff view of reports list
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { critical, patient_id } = req.query;

    let query = db.from('reports').select('*').order('created_at', { ascending: false });

    if (typeof critical !== 'undefined') {
      query = query.eq('is_critical', critical === 'true');
    }
    if (patient_id) {
      query = query.eq('patient_id', parseInt(patient_id, 10));
    }

    const { data: reports } = await query;
    const allReports = reports || [];

    const total = allReports.length;
    const startIndex = (page - 1) * limit;
    const paginated = allReports.slice(startIndex, startIndex + limit);

    return response.success(res, paginated, 200, response.buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reports — Generate secure report link & notify
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { patientId, reportType, reportUrl, doctorNotes, isCritical } = req.body;
    if (!patientId || !reportType || !reportUrl) {
      return response.error(res, 'patientId, reportType, and reportUrl are required.', 400);
    }

    const result = await reportService.createReport({
      patientId: parseInt(patientId, 10),
      reportType,
      reportUrl,
      doctorNotes,
      isCritical: Boolean(isCritical),
      userId: req.user.id,
      ip: req.ip,
    });

    return response.success(res, result, 201);
  } catch (err) {
    return response.error(res, err.message, 400);
  }
});

/**
 * GET /api/reports/view/:token — Patient verification endpoint (Enforces 7-day expiry and revocation)
 */
router.get('/view/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const report = await reportService.verifyReportAccess(token, req.ip);

    // Return sanitized view payload (no sensitive tokens exposed)
    return response.success(res, {
      reportType: report.report_type,
      reportUrl: report.report_url,
      doctorNotes: report.doctor_notes,
      isCritical: report.is_critical,
      expiresAt: report.expires_at,
      createdAt: report.created_at,
      patientName: report.patient ? report.patient.name : 'Valued Patient',
    });
  } catch (err) {
    return response.error(res, err.message, 403);
  }
});

/**
 * POST /api/reports/:id/revoke — Staff revoke link access
 */
router.post('/:id/revoke', requireAuth, requireRole('admin', 'doctor', 'receptionist'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await reportService.revokeReport(id, {
      userId: req.user.id,
      ip: req.ip,
    });
    return response.success(res, { message: 'Report link access successfully revoked.', report: updated });
  } catch (err) {
    return response.error(res, err.message, 400);
  }
});

module.exports = router;
