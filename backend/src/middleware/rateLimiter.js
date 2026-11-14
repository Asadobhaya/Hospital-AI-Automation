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
  max: 10, // max 10 failed login attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return response.error(res, 'Too many login attempts. Your IP has been temporarily rate limited for 15 minutes.', 429);
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
