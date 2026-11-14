// src/middleware/errorHandler.js — Global error handling & sanitization
'use strict';

const logger = require('../utils/logger');
const response = require('../utils/response');
const db = require('../db/dbAdapter');

// eslint-disable-next-line no-unused-vars
async function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status && Number(err.status)) || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Sanitize message: never leak DB strings or credentials
  let safeMessage = err.message || 'An unexpected error occurred';
  if (statusCode === 500 && isProd) {
    safeMessage = 'Internal Server Error. Please contact hospital support.';
  }

  // Detect and flag security probes or injection patterns
  const urlLower = req.originalUrl.toLowerCase();
  if (
    urlLower.includes('..') ||
    urlLower.includes('.env') ||
    urlLower.includes('.git') ||
    urlLower.includes('wp-admin') ||
    urlLower.includes('union%20select') ||
    urlLower.includes('etc/passwd')
  ) {
    logger.warn('SECURITY ALERT: Malicious probe pattern intercepted', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent']
    });
  }

  // Log error with context
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    ip: req.ip,
    user: req.user ? req.user.email : 'unauthenticated',
  });

  // Asynchronously record to error_log table for hospital administrators
  try {
    await db.from('error_log').insert({
      source: `api_${req.method}_${req.path.replace(/[^a-zA-Z0-9_]/g, '_')}`.slice(0, 100),
      error_detail: JSON.stringify({
        message: err.message,
        path: req.originalUrl,
        statusCode,
      }).slice(0, 2000),
      severity: statusCode >= 500 ? 'error' : 'warning',
      resolved: false,
      created_at: new Date().toISOString(),
    });
  } catch (logErr) {
    logger.warn('Failed to persist error to error_log table', logErr);
  }

  return response.error(res, safeMessage, statusCode, err.details || null);
}

module.exports = errorHandler;
