// src/config.js — Environment configuration with validation
'use strict';

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || parseInt(process.env.DASHBOARD_PORT, 10) || 3001,
  apiVersion: process.env.API_VERSION || 'v1',

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'hospital-ai-automation-super-secure-jwt-secret-key-32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieName: 'hospital_token',
    refreshCookieName: 'hospital_refresh_token',
  },

  whatsapp: {
    verifyToken: process.env.WA_VERIFY_TOKEN || 'hospital_verify_token_secure_123',
    phoneNumberId: process.env.WA_PHONE_NUMBER_ID || 'mock_phone_id',
    accessToken: process.env.WA_ACCESS_TOKEN || 'mock_access_token',
    appSecret: process.env.WA_APP_SECRET || '',
  },

  voice: {
    baseUrl: process.env.VOICE_API_BASE_URL || 'https://mock-voice-api.hospital.internal',
    apiKey: process.env.VOICE_API_KEY || 'mock_voice_key',
    callbackSecret: process.env.VOICE_CALLBACK_SECRET || 'voice_callback_hmac_secret',
  },

  email: {
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    alertFromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@hospital.test',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@hospital.test',
  },

  reportPortal: {
    baseUrl: process.env.REPORT_PORTAL_BASE_URL || 'http://localhost:5173',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
