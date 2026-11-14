// src/routes/escalations.js — Front Desk Escalations API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const response = require('../utils/response');
const { logAction } = require('../services/auditService');

/**
 * GET /api/escalations — List human handoffs
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { resolved } = req.query;
    let query = db.from('escalations').select('*').order('created_at', { ascending: false });

    if (typeof resolved !== 'undefined') {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data: escalations } = await query;
    return response.success(res, escalations || []);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/escalations/:id/resolve — Mark resolved by staff
 */
router.patch('/:id/resolve', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { notes } = req.body;

    const { data: updated, error } = await db.from('escalations').update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: req.user.email,
      notes: notes || 'Resolved by staff',
    }).eq('id', id);

    if (error) return response.error(res, error.message, 400);

    await logAction({
      userId: req.user.id,
      action: 'RESOLVE_ESCALATION',
      resourceType: 'escalation',
      resourceId: id,
      details: { notes },
      ip: req.ip,
    });

    return response.success(res, updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
