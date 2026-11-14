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
 * Sign a JWT access token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'hospital-ai-platform',
    audience: 'hospital-ai-api',
  });
}

/**
 * Sign a JWT refresh token
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

  res.cookie(config.jwt.refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  });
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
  signAccessToken,
  signRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
};
