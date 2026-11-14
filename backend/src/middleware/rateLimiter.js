// src/middleware/rateLimiter.js — API Rate Limiting, Abuse & Anti-Scraping Protection
'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');
const response = require('../utils/response');
const logger = require('../utils/logger');

// General API rate limiter (100 req / window)
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs || 60 * 1000,
  max: config.rateLimit.max || 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded: General API', { ip: req.ip, path: req.originalUrl });
    return response.error(res, 'Too many requests. Please slow down and try again later.', 429);
  },
});

// Authentication rate limiter (brute-force protection: max 10 failed login attempts / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Suspicious activity: Auth rate limit triggered', { ip: req.ip, email: req.body?.email });
    return response.error(res, 'Too many login attempts. Your IP has been temporarily rate limited for 15 minutes.', 429);
  },
});

// Password reset & email verification rate limiter (prevents email spam & token generation abuse)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded: Password reset requests', { ip: req.ip });
    return response.error(res, 'Too many password reset requests. Please wait an hour before requesting again.', 429);
  },
});

// Account creation rate limiter (anti-bot account mass-creation)
const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded: Account creation', { ip: req.ip });
    return response.error(res, 'Too many account creation attempts. Please try again later.', 429);
  },
});

// AI generation and webhook rate limiter (prevents LLM abuse and automated DDoS)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 AI triage requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded: AI triage requests', { ip: req.ip });
    return response.error(res, 'AI processing rate limit reached. Please wait a moment before sending another message.', 429);
  },
});

// Anti-scraping rate limiter for patient directories & lab reports
const scrapingProtectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Suspicious data scraping pattern detected', { ip: req.ip, path: req.originalUrl, user: req.user?.email });
    return response.error(res, 'Unusual browsing pattern detected. High-frequency automated data scraping is strictly prohibited.', 429);
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  accountCreationLimiter,
  aiLimiter,
  scrapingProtectionLimiter,
};
