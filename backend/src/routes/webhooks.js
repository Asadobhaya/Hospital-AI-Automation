// src/routes/webhooks.js — External Inbound Webhook Handlers
'use strict';

const express = require('express');
const router = express.Router();
const config = require('../config');
const db = require('../db/dbAdapter');
const { handleVoiceCallback, verifyVoiceCallbackSignature } = require('../services/voiceService');
const { screenIncomingMessage } = require('../services/aiSafetyService');
const { createReport } = require('../services/reportService');
const { processFeedback } = require('../services/feedbackService');
const logger = require('../utils/logger');
const response = require('../utils/response');

/**
 * GET /api/webhooks/whatsapp — Meta Webhook Handshake Verification
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('WhatsApp webhook verified successfully');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification rejected: token mismatch');
  return res.status(403).json({ error: 'forbidden', message: 'Verification token mismatch.' });
});

/**
 * POST /api/webhooks/whatsapp — Inbound WhatsApp Messages
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    // Check entry structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const messages = changes?.messages;

    if (!messages || messages.length === 0) {
      // Status update event (sent, delivered, read)
      return res.status(200).json({ status: 'ignored_status_update' });
    }

    const msg = messages[0];
    const fromPhone = msg.from;
    const waMessageId = msg.id;
    const contactName = changes?.contacts?.[0]?.profile?.name || 'Patient';

    let text = '';
    if (msg.type === 'text') {
      text = msg.text?.body || '';
    } else if (msg.type === 'interactive') {
      text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
    } else if (msg.type === 'button') {
      text = msg.button?.text || '';
    }

    // Idempotency: Ignore duplicate message if already processed
    const { data: existingMsg } = await db.from('message_log').select('*').eq('wa_message_id', waMessageId).single();
    if (existingMsg) {
      return res.status(200).json({ status: 'duplicate_ignored', received: true });
    }

    // Save inbound message
    await db.from('message_log').insert({
      patient_phone: fromPhone,
      direction: 'inbound',
      message_type: msg.type,
      content: text,
      wa_message_id: waMessageId,
      status: 'received',
      created_at: new Date().toISOString(),
    });

    // Upsert patient
    await db.from('patients').insert({
      phone: fromPhone,
      name: contactName,
      last_message_at: new Date().toISOString(),
    });

    const trimmed = text.trim();

    // Check if numeric feedback rating (1-5) for pending feedback request
    if (/^[1-5]$/.test(trimmed)) {
      const { data: pendingFeedback } = await db
        .from('feedback')
        .select('*')
        .eq('patient_phone', fromPhone)
        .is('rating', null)
        .order('requested_at', { ascending: false })
        .limit(1);

      if (pendingFeedback && pendingFeedback.length > 0) {
        const result = await processFeedback({
          appointmentId: pendingFeedback[0].appointment_id,
          patientPhone: fromPhone,
          rating: parseInt(trimmed, 10),
          ip: req.ip,
        });
        return res.status(200).json({ status: 'feedback_processed', result });
      }
    }

    // Run message through AI Medical Safety screen
    const safetyCheck = await screenIncomingMessage(text, fromPhone);
    if (safetyCheck.isEmergency || safetyCheck.blocked) {
      return res.status(200).json({
        status: 'safety_intercepted',
        reply: safetyCheck.response,
      });
    }

    return res.status(200).json({
      status: 'processed',
      received: true,
      patientPhone: fromPhone,
      action: 'routed_to_ai_agent',
    });
  } catch (err) {
    logger.error('Error processing WhatsApp webhook', err);
    return res.status(200).json({ status: 'error_logged', received: true }); // WhatsApp requires 200 to not endlessly retry
  }
});

/**
 * POST /api/webhooks/voice or /api/webhooks/voice/callback — AI Voice Call Outcome Callback
 */
router.post(['/voice', '/voice/callback'], async (req, res) => {
  try {
    const signature = req.headers['x-voice-signature'] || req.headers['x-webhook-signature'];
    
    // Strict security check: reject requests without valid HMAC signature when secret is configured
    if (config.voice.callbackSecret && config.voice.callbackSecret !== '') {
      if (!signature || !verifyVoiceCallbackSignature(signature, req.body)) {
        logger.warn('Unauthorized voice callback rejected: invalid or missing HMAC signature');
        return response.error(res, 'Invalid or missing voice callback signature.', 401);
      }
    } else if (signature && !verifyVoiceCallbackSignature(signature, req.body)) {
      return response.error(res, 'Invalid voice callback signature.', 401);
    }

    const { call_id, appointment_id, patient_phone, status, outcome, transcript_summary, duration_seconds } = req.body;

    const result = await handleVoiceCallback({
      callId: call_id,
      appointmentId: appointment_id ? parseInt(appointment_id, 10) : null,
      patientPhone: patient_phone,
      status,
      outcome,
      transcriptSummary: transcript_summary,
      durationSeconds: duration_seconds ? parseInt(duration_seconds, 10) : null,
      ip: req.ip,
    });

    return res.status(200).json({ status: 'ok', success: true, data: result });
  } catch (err) {
    logger.error('Error processing voice callback', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/webhooks/report-ready — EMR/Lab Report Notification
 */
router.post('/report-ready', async (req, res) => {
  try {
    const { patient_id, patient_phone, report_type, report_url, doctor_notes, is_critical } = req.body;

    if ((!patient_id && !patient_phone) || !report_type || !report_url) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'patient_id or patient_phone, report_type, and report_url are required.',
      });
    }

    let targetPatientId = patient_id;
    if (!targetPatientId && patient_phone) {
      const { data: patient } = await db.from('patients').select('*').eq('phone', patient_phone).single();
      if (!patient) {
        return res.status(404).json({ error: 'patient_not_found', message: 'Patient record not found.' });
      }
      targetPatientId = patient.id;
    }

    const result = await createReport({
      patientId: targetPatientId,
      reportType: report_type,
      reportUrl: report_url,
      doctorNotes: doctor_notes,
      isCritical: is_critical === true,
      ip: req.ip,
    });

    return res.status(200).json({
      status: 'notified',
      secure_link: result.secureLink,
      report_id: result.report.id,
    });
  } catch (err) {
    logger.error('Error handling report-ready webhook', err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

module.exports = router;
