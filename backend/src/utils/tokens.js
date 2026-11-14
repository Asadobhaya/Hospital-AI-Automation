// src/utils/tokens.js — Secure token and JWT utilities
'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token with SHA-256 for safe database storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/**
 * Generate an expiring token with both plaintext and SHA-256 hash
 */
function generateExpiringToken(ttlSeconds = 3600) {
  const token = generateSecureToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return { token, tokenHash, expiresAt };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Sign a JWT access token (15m - 24h configured)
 */
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'hospital-ai-platform',
    audience: 'hospital-ai-api',
  });
}

/**
 * Sign a JWT refresh token (7d)
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'hospital-ai-platform',
    audience: 'hospital-ai-refresh',
  });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token, audience = 'hospital-ai-api') {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'hospital-ai-platform',
    audience,
  });
}

/**
 * Set auth cookies on the response
 */
function setAuthCookies(res, accessToken, refreshToken) {
  const isProduction = config.env === 'production';

  res.cookie(config.jwt.cookieName, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  if (refreshToken) {
    res.cookie(config.jwt.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',
    });
  }
}

/**
 * Clear auth cookies
 */
function clearAuthCookies(res) {
  res.clearCookie(config.jwt.cookieName, { path: '/' });
  res.clearCookie(config.jwt.refreshCookieName, { path: '/api/auth/refresh' });
}

module.exports = {
  generateSecureToken,
  hashToken,
  generateExpiringToken,
  constantTimeCompare,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
};
