// src/services/reportService.js — Secure Patient Report Delivery & Verification
'use strict';

const crypto = require('crypto');
const db = require('../db/dbAdapter');
const { logAction } = require('./auditService');
const config = require('../config');

/**
 * Generate cryptographically secure token
 */
function generateReportToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new report record with secure token
 */
async function createReport({ patientId, reportType, reportUrl, doctorNotes = '', isCritical = false, userId = null, ip = null }) {
  if (!patientId) throw new Error('patientId is required.');
  if (!reportType) throw new Error('reportType is required.');
  if (!reportUrl) throw new Error('reportUrl is required.');

  // Validate patient exists
  const { data: patient } = await db.from('patients').select('*').eq('id', patientId).single();
  if (!patient) throw new Error('Patient not found.');

  const token = generateReportToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  const { data: report, error } = await db.from('reports').insert({
    patient_id: patientId,
    report_type: reportType,
    report_url: reportUrl,
    secure_token: token,
    expires_at: expiresAt,
    is_critical: Boolean(isCritical),
    doctor_notes: doctorNotes,
    is_revoked: false,
    access_count: 0,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message || 'Failed to save report record.');

  const secureLink = `${config.reportPortal.baseUrl}/reports/view?token=${token}`;

  await logAction({
    userId,
    action: 'CREATE_REPORT',
    resourceType: 'report',
    resourceId: report.id,
    details: { patientId, reportType, isCritical },
    ip,
  });

  return { report, secureToken: report.secure_token, secureLink, patient };
}

/**
 * Server-side verification of report access token
 */
async function verifyReportAccess(token, ip = '127.0.0.1') {
  if (!token || typeof token !== 'string' || token.length < 32) {
    throw new Error('Invalid or missing report access token.');
  }

  const { data: report } = await db.from('reports').select('*').eq('secure_token', token).single();
  if (!report) {
    throw new Error('Report not found or invalid token.');
  }

  if (report.is_revoked) {
    throw new Error('This report access link has been revoked by hospital staff.');
  }

  if (new Date() > new Date(report.expires_at)) {
    throw new Error('This report access link has expired (validity is 7 days). Please contact the hospital for a new link.');
  }

  // Increment access count & update accessed_at
  const newCount = (report.access_count || 0) + 1;
  const now = new Date().toISOString();
  report.access_count = newCount;
  report.accessed_at = now;

  await db.from('reports').update({
    access_count: newCount,
    accessed_at: now,
  }).eq('id', report.id);

  await logAction({
    userId: null,
    action: 'ACCESS_REPORT',
    resourceType: 'report',
    resourceId: report.id,
    details: { accessCount: newCount },
    ip,
  });

  return report;
}

/**
 * Revoke a report link
 */
async function revokeReport(reportId, { userId = null, ip = null } = {}) {
  const { data: existing } = await db.from('reports').select('*').eq('id', reportId).single();
  if (!existing) throw new Error('Report not found.');

  const { data: updated, error } = await db.from('reports').update({
    is_revoked: true,
  }).eq('id', reportId);

  if (error) throw new Error(error.message || 'Failed to revoke report.');

  await logAction({
    userId,
    action: 'REVOKE_REPORT_ACCESS',
    resourceType: 'report',
    resourceId: reportId,
    details: { reason: 'Manually revoked by staff' },
    ip,
  });

  return updated;
}

module.exports = {
  generateReportToken,
  createReport,
  verifyReportAccess,
  getReportByToken: verifyReportAccess,
  revokeReport,
};
