// src/services/auditService.js — Privacy-conscious Audit Logging
'use strict';

const db = require('../db/dbAdapter');
const logger = require('../utils/logger');

async function logAction({ userId, action, resourceType, resourceId, details, ip }) {
  try {
    await db.from('audit_log').insert({
      user_id: userId || null,
      action,
      resource_type: resourceType,
      resource_id: String(resourceId || ''),
      details: details || {},
      ip_address: ip || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('Failed to record audit log', err);
  }
}

module.exports = {
  logAction,
};
