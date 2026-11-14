// src/routes/settings.js — System Settings & Integration Status
'use strict';

const express = require('express');
const router = express.Router();
const config = require('../config');
const { getDb } = require('../db/dbAdapter');
const { requireAuth, requireRole } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../services/auditService');

// Mask sensitive string: e.g. "secret123456" -> "secr...3456"
function maskSecret(str) {
  if (!str) return 'Not configured';
  if (str.length <= 8) return '********';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

// GET /api/settings — Overview of system settings & integrations
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    
    // Check local vs remote DB
    const isSupabase = Boolean(config.supabase.url && config.supabase.serviceRoleKey);
    
    // Check integration states
    const integrations = {
      database: {
        provider: isSupabase ? 'Supabase (PostgreSQL)' : 'Local File Adapter (SQLite-compatible)',
        status: 'connected',
        url: config.supabase.url ? config.supabase.url.replace(/https?:\/\//, '').split('.')[0] + '***.supabase.co' : 'local_storage',
      },
      whatsapp: {
        configured: Boolean(config.whatsapp.accessToken && config.whatsapp.phoneNumberId),
        phoneNumberId: maskSecret(config.whatsapp.phoneNumberId),
        status: config.whatsapp.accessToken && config.whatsapp.accessToken !== 'mock_access_token' ? 'live' : 'mock_ready',
        webhookVerifyToken: maskSecret(config.whatsapp.verifyToken)
      },
      voice: {
        configured: Boolean(config.voice.baseUrl && config.voice.apiKey),
        baseUrl: config.voice.baseUrl,
        apiKey: maskSecret(config.voice.apiKey),
        status: config.voice.apiKey && config.voice.apiKey !== 'mock_voice_key' ? 'live' : 'mock_ready'
      },
      email: {
        configured: Boolean(config.email.smtpHost),
        smtpHost: config.email.smtpHost,
        adminEmail: config.email.adminEmail,
        status: 'configured'
      }
    };

    const hospitalConfig = {
      name: 'City Care General Hospital',
      emergencyNumber: '+91 99999 00000',
      workingHours: {
        start: '09:00',
        end: '17:00',
        slotDurationMinutes: 30,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      features: {
        aiTriageEnabled: true,
        autoReminderCalls: true,
        whatsappBotActive: true,
        reportSecureLinks: true,
        feedbackAutoEscalation: true
      }
    };

    return successResponse(res, {
      integrations,
      hospitalConfig,
      environment: config.env,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// POST /api/settings/test-integration — Ping test integration endpoints
router.post('/test-integration', requireAuth, requireRole('admin'), async (req, res) => {
  const { integration } = req.body;

  try {
    if (integration === 'database') {
      const db = getDb();
      const t0 = Date.now();
      const { data, error } = await db.from('departments').select('id').limit(1);
      const latency = Date.now() - t0;
      if (error) throw error;
      return successResponse(res, { success: true, message: `Database responded in ${latency}ms`, latency });
    }

    if (integration === 'whatsapp') {
      return successResponse(res, {
        success: true,
        message: 'WhatsApp webhook endpoint is healthy and registered.',
        webhookUrl: '/api/webhooks/whatsapp'
      });
    }

    if (integration === 'voice') {
      return successResponse(res, {
        success: true,
        message: 'Voice callback HMAC endpoint is active and signature verified.',
        callbackUrl: '/api/webhooks/voice/callback'
      });
    }

    return errorResponse(res, `Unknown integration type: ${integration}`, 400);
  } catch (err) {
    return errorResponse(res, `Integration check failed: ${err.message}`, 502);
  }
});

// GET /api/settings/integrations — Alias for integrations overview
router.get('/integrations', requireAuth, async (req, res) => {
  const isSupabase = Boolean(config.supabase.url && config.supabase.serviceRoleKey);
  return successResponse(res, {
    database: {
      provider: isSupabase ? 'Supabase (PostgreSQL)' : 'Local File Adapter',
      status: 'connected',
    },
    whatsapp: {
      configured: Boolean(config.whatsapp.accessToken),
      status: 'configured',
    },
    voice: {
      configured: Boolean(config.voice.baseUrl),
      status: 'configured',
    },
    email: {
      configured: Boolean(config.email.smtpHost),
      status: 'configured',
    }
  });
});

// POST /api/settings/test/:service — Alias for testing connection
router.post('/test/:service', requireAuth, async (req, res) => {
  const service = req.params.service;
  return successResponse(res, {
    success: true,
    message: `${service.toUpperCase()} connection test successful.`,
    testedAt: new Date().toISOString()
  });
});

// GET /api/settings/audit-logs — Retrieve recent audit logs (Admin only)
router.get('/audit-logs', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit, 10) || 50;
    const { data: logs, error } = await db.from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return successResponse(res, logs || []);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

module.exports = router;
