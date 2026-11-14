// src/services/voiceService.js — AI Voice Calling & Webhook Verification
'use strict';

const crypto = require('crypto');
const db = require('../db/dbAdapter');
const config = require('../config');
const logger = require('../utils/logger');
const { logAction } = require('./auditService');

/**
 * Verify HMAC signature on incoming voice callback
 */
function verifyVoiceCallbackSignature(signature, payloadRaw) {
  if (!config.voice.callbackSecret) return true; // Dev fallback if secret not set
  if (!signature || typeof signature !== 'string') return false;

  const expected = crypto
    .createHmac('sha256', config.voice.callbackSecret)
    .update(typeof payloadRaw === 'string' ? payloadRaw : JSON.stringify(payloadRaw))
    .digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.byteLength !== expectedBuffer.byteLength) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Handle voice callback payload from calling server
 */
async function handleVoiceCallback({ callId, appointmentId, patientPhone, status, outcome, transcriptSummary, durationSeconds = null, ip = null }) {
  logger.info(`Voice callback received for appointment ${appointmentId}, outcome: ${outcome}`);

  // Validate appointment if provided
  let appointment = null;
  if (appointmentId) {
    const { data: appt } = await db.from('appointments').select('*').eq('id', appointmentId).single();
    appointment = appt;
  }

  // 1. Log call outcome in call_logs table
  const { data: callLog, error: logErr } = await db.from('call_logs').insert({
    appointment_id: appointmentId || null,
    patient_phone: patientPhone || (appointment ? appointment.patient?.phone : ''),
    call_type: 'status_callback',
    status: status || 'completed',
    outcome: outcome || 'unknown',
    transcript_summary: transcriptSummary || '',
    duration_seconds: durationSeconds,
    created_at: new Date().toISOString(),
  });

  if (logErr) {
    logger.warn('Failed to insert call log', logErr);
  }

  // 2. Route outcome to update appointment
  if (appointment) {
    if (outcome === 'confirmed') {
      await db.from('appointments').update({
        confirmed_via_call: true,
      }).eq('id', appointment.id);
    } else if (outcome === 'reschedule_requested') {
      await db.from('appointments').update({
        status: 'reschedule_pending',
      }).eq('id', appointment.id);
    } else if (outcome === 'cancelled') {
      await db.from('appointments').update({
        status: 'cancelled',
      }).eq('id', appointment.id);
    } else if (outcome === 'no_answer' || outcome === 'failed') {
      const newRetryCount = (appointment.retry_count || 0) + 1;
      await db.from('appointments').update({
        retry_count: newRetryCount,
      }).eq('id', appointment.id);

      // If patient unreachable after 2 attempts -> Escalate to human front-desk
      if (newRetryCount >= 2) {
        await db.from('escalations').insert({
          patient_phone: patientPhone || (appointment.patient?.phone || 'Unknown'),
          reason: `Patient unreachable by automated voice call after ${newRetryCount} attempts for appointment #${appointment.id}. Manual phone follow-up required.`,
          urgency: 'normal',
          resolved: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  await logAction({
    userId: null,
    action: 'VOICE_CALLBACK_PROCESSED',
    resourceType: 'call',
    resourceId: callId || appointmentId,
    details: { outcome, status },
    ip,
  });

  return { success: true, callLog, outcome };
}

module.exports = {
  verifyVoiceCallbackSignature,
  handleVoiceCallback,
};
