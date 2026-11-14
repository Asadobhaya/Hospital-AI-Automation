// src/routes/messages.js — WhatsApp & Messaging Support API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const response = require('../utils/response');
const { screenIncomingMessage, screenMessage } = require('../services/aiSafetyService');
const { logAction } = require('../services/auditService');

/**
 * GET /api/messages/conversations — List unique conversations with last message snippet
 */
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const { data: allMessages } = await db.from('message_log').select('*').order('created_at', { ascending: false });
    const { data: allPatients } = await db.from('patients').select('*');

    const patientMap = new Map();
    (allPatients || []).forEach((p) => {
      if (p.phone) patientMap.set(p.phone, p);
    });

    const conversationMap = new Map();
    (allMessages || []).forEach((m) => {
      if (!m.patient_phone) return;
      if (!conversationMap.has(m.patient_phone)) {
        const patient = patientMap.get(m.patient_phone);
        conversationMap.set(m.patient_phone, {
          patient_phone: m.patient_phone,
          patient_name: patient ? patient.name : 'Patient',
          last_message_at: m.created_at,
          last_message_content: m.content || '',
          last_direction: m.direction,
          unread: false
        });
      }
    });

    // Also include any patients who don't have message log entries yet
    (allPatients || []).forEach((p) => {
      if (p.phone && !conversationMap.has(p.phone)) {
        conversationMap.set(p.phone, {
          patient_phone: p.phone,
          patient_name: p.name,
          last_message_at: p.last_message_at || p.created_at,
          last_message_content: 'Patient registered in system',
          last_direction: 'inbound',
          unread: false
        });
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    return response.success(res, conversations);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages/errors — Retrieve recent messaging error logs
 */
router.get('/errors', requireAuth, async (req, res, next) => {
  try {
    const { data: errors } = await db.from('error_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return response.success(res, errors || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages/:phone — Timeline for a specific phone number
 */
router.get('/:phone', requireAuth, async (req, res, next) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const { data: messages } = await db.from('message_log')
      .select('*')
      .eq('patient_phone', phone)
      .order('created_at', { ascending: true });

    return response.success(res, messages || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages — Fallback query by ?phone=...
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { phone } = req.query;
    let query = db.from('message_log').select('*').order('created_at', { ascending: true });

    if (phone) {
      query = query.eq('patient_phone', phone);
    }

    const { data: messages } = await query;
    return response.success(res, messages || []);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/messages/staff-reply and /api/messages/send — Staff direct response / Human takeover
 */
router.post(['/staff-reply', '/send'], requireAuth, async (req, res, next) => {
  try {
    const { patientPhone, message, content } = req.body;
    const bodyContent = message || content;

    if (!patientPhone || !bodyContent) {
      return response.error(res, 'patientPhone and message content are required.', 400);
    }

    // Record outbound staff message
    const { data: savedMessage, error } = await db.from('message_log').insert({
      patient_phone: patientPhone,
      direction: 'staff',
      message_type: 'text',
      content: bodyContent.trim(),
      wa_message_id: 'manual_staff_' + Date.now(),
      status: 'sent',
      metadata: { sent_by: req.user ? req.user.email : 'staff' },
      created_at: new Date().toISOString(),
    });

    if (error) return response.error(res, error.message, 400);

    // Update patient last contact
    await db.from('patients').update({
      last_message_at: new Date().toISOString()
    }).eq('phone', patientPhone);

    await logAction({
      userId: req.user ? req.user.id : null,
      action: 'STAFF_MESSAGE_SENT',
      resourceType: 'message',
      resourceId: patientPhone,
      details: { textLength: bodyContent.length },
      ip: req.ip
    });

    return response.success(res, savedMessage, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/messages/ai-screen and /api/messages/test-ai — Test AI prompt & clinical guardrail screening (Rate limited)
 */
router.post(['/ai-screen', '/test-ai'], requireAuth, aiLimiter, async (req, res, next) => {
  try {
    const { text, patientPhone } = req.body;
    if (!text) return response.error(res, 'text is required.', 400);

    const screening = await screenMessage(text, patientPhone);
    return response.success(res, screening);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
