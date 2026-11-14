// src/routes/calls.js — AI Voice Calling Operations
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const response = require('../utils/response');
const { logAction } = require('../services/auditService');

/**
 * GET /api/calls — List voice call attempts and outcomes
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { outcome, status } = req.query;

    let query = db.from('call_logs').select('*').order('created_at', { ascending: false });

    if (outcome) query = query.eq('outcome', outcome);
    if (status) query = query.eq('status', status);

    const { data: calls } = await query;
    const allCalls = calls || [];

    const total = allCalls.length;
    const startIndex = (page - 1) * limit;
    const paginated = allCalls.slice(startIndex, startIndex + limit);

    return response.success(res, paginated, 200, response.buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calls/:id/retry and POST /api/calls/retry — Trigger manual retry for failed/no_answer call
 */
router.post(['/:id/retry', '/retry'], requireAuth, async (req, res, next) => {
  try {
    let appointmentId = req.body.appointmentId;
    let patientPhone = req.body.patientPhone;

    if (req.params.id) {
      const callId = parseInt(req.params.id, 10);
      const { data: existingCall } = await db.from('call_logs').select('*').eq('id', callId).single();
      if (existingCall) {
        appointmentId = appointmentId || existingCall.appointment_id;
        patientPhone = patientPhone || existingCall.patient_phone;
      }
    }

    if (!appointmentId && !patientPhone) {
      return response.error(res, 'appointmentId or patientPhone is required.', 400);
    }

    const { data: newCallLog } = await db.from('call_logs').insert({
      appointment_id: appointmentId || null,
      patient_phone: patientPhone || '',
      call_type: 'manual_retry',
      status: 'queued',
      outcome: null,
      transcript_summary: 'Manual outbound retry triggered by authorized staff.',
      created_at: new Date().toISOString(),
    });

    await logAction({
      userId: req.user.id,
      action: 'TRIGGER_CALL_RETRY',
      resourceType: 'call',
      resourceId: req.params.id || appointmentId || patientPhone,
      details: { patientPhone, originalCallId: req.params.id },
      ip: req.ip,
    });

    return response.success(res, {
      message: 'Call retry queued successfully.',
      callLog: newCallLog,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
