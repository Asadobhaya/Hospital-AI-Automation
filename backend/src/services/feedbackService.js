// src/services/feedbackService.js — Feedback Processing & Sentiment Routing
'use strict';

const db = require('../db/dbAdapter');
const { logAction } = require('./auditService');
const config = require('../config');

/**
 * Record and route patient feedback
 */
async function processFeedback({ appointmentId, patientPhone, rating, comment = '', ip = null }) {
  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error('Rating must be a whole number between 1 and 5.');
  }

  // Check if feedback already recorded for this appointment
  if (appointmentId) {
    const { data: existingFeedback } = await db
      .from('feedback')
      .select('*')
      .eq('appointment_id', appointmentId)
      .not('rating', 'is', null);

    if (existingFeedback && existingFeedback.length > 0) {
      throw new Error('Feedback has already been submitted for this appointment.');
    }
  }

  // Look up patient
  let patientId = null;
  if (patientPhone) {
    const { data: patient } = await db.from('patients').select('*').eq('phone', patientPhone).single();
    if (patient) patientId = patient.id;
  }

  // Save feedback record
  const { data: feedbackRecord, error } = await db.from('feedback').insert({
    appointment_id: appointmentId || null,
    patient_id: patientId,
    patient_phone: patientPhone || '',
    rating: numericRating,
    comment,
    requested_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    responded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message || 'Failed to persist feedback record.');

  let outcome = 'standard';
  let message = 'Thank you for your feedback.';

  // Routing: Rating 1-3 -> Escalate to hospital front-desk
  if (numericRating <= 3) {
    outcome = 'escalated';
    message = 'We are truly sorry for your experience. Our front-desk supervisory team will follow up with you shortly.';

    await db.from('escalations').insert({
      patient_phone: patientPhone || 'Unknown',
      reason: `Unhappy patient feedback (${numericRating}/5 stars). Comment: "${comment || 'No comment provided'}"`,
      urgency: numericRating === 1 ? 'urgent' : 'normal',
      resolved: false,
      created_at: new Date().toISOString(),
    });
  } else {
    // Rating 4-5 -> Invite for Google Review
    outcome = 'review_requested';
    message = 'Thank you for your rating! If you have 30 seconds, please consider leaving us a review on Google: ' + (config.googleReviewLink || '');
  }

  await logAction({
    userId: null,
    action: 'SUBMIT_FEEDBACK',
    resourceType: 'feedback',
    resourceId: feedbackRecord.id,
    details: { rating: numericRating, outcome },
    ip,
  });

  return {
    feedback: feedbackRecord,
    outcome,
    message,
    rating: numericRating,
  };
}

module.exports = {
  processFeedback,
};
