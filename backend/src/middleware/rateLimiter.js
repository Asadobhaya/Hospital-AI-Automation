// src/middleware/rateLimiter.js — API Rate Limiting and Brute-force protection
'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');
const response = require('../utils/response');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return response.error(res, 'Too many requests. Please try again later.', 429);
  },
});

// Stricter rate limiter for authentication routes (login / refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 login attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return response.error(res, 'Too many login attempts. Please wait a moment and try again.', 429);
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
