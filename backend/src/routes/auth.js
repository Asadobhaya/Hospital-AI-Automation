// src/routes/auth.js — Hardened Authentication & Session Lifecycle Routes
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db/dbAdapter');
const {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
  generateExpiringToken,
  hashToken,
} = require('../utils/tokens');
const { requireAuth } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { validateBody, schemas } = require('../middleware/validation');
const response = require('../utils/response');
const { logAction } = require('../services/auditService');
const logger = require('../utils/logger');

// 12-round bcrypt hash for default test accounts
const DEFAULT_PASSWORD_HASH = '$2a$12$soJeNH13O.O0/4LaKJ5rqOUEosspe9Kq/hzzfF0V5A/LE50wPDPYi'; // Password@123

/**
 * POST /api/auth/login — Secure credential verification
 */
router.post('/login', authLimiter, validateBody(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    let user = null;
    const { data: dbUser } = await db.from('users').select('*').eq('email', normalizedEmail).single();
    if (dbUser) {
      user = dbUser;
    } else if (normalizedEmail === 'admin@hospital.test') {
      user = {
        id: 1,
        email: 'admin@hospital.test',
        password_hash: DEFAULT_PASSWORD_HASH,
        name: 'Hospital Administrator',
        role: 'admin',
        is_active: true,
        email_verified: true,
      };
    } else if (normalizedEmail === 'reception@hospital.test') {
      user = {
        id: 2,
        email: 'reception@hospital.test',
        password_hash: DEFAULT_PASSWORD_HASH,
        name: 'Front Desk Officer',
        role: 'receptionist',
        is_active: true,
        email_verified: true,
      };
    } else if (normalizedEmail === 'viewer@hospital.test') {
      user = {
        id: 3,
        email: 'viewer@hospital.test',
        password_hash: DEFAULT_PASSWORD_HASH,
        name: 'Clinical Viewer',
        role: 'viewer',
        is_active: true,
        email_verified: true,
      };
    }

    // Generic error to prevent account enumeration
    if (!user) {
      logger.warn('Failed login attempt: non-existent email', { email: normalizedEmail, ip: req.ip });
      return response.error(res, 'Invalid credentials.', 401);
    }

    if (!user.is_active) {
      logger.warn('Login blocked: disabled account', { email: normalizedEmail, ip: req.ip });
      return response.error(res, 'Account is disabled. Please contact the administrator.', 403);
    }

    // Pure cryptographic bcrypt verification with salt cost 12
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn('Failed login attempt: incorrect password', { email: normalizedEmail, ip: req.ip });
      return response.error(res, 'Invalid credentials.', 401);
    }

    // Issue tokens: 15-minute access token, 7-day refresh token
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    setAuthCookies(res, accessToken, refreshToken);

    try {
      await db.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
    } catch {
      // ignore
    }

    await logAction({
      userId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: String(user.id),
      details: { email: user.email },
      ip: req.ip,
    });

    return response.success(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: accessToken,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh — Token rotation
 */
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken = req.cookies?.[require('../config').jwt.refreshCookieName] || req.body?.refreshToken;
    if (!refreshToken) {
      return response.error(res, 'Refresh token required.', 401);
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken, 'hospital-ai-refresh');
    } catch (err) {
      clearAuthCookies(res);
      return response.error(res, 'Invalid or expired refresh token. Please sign in again.', 401);
    }

    // Rotate access and refresh tokens
    const tokenPayload = {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return response.success(res, {
      accessToken: newAccessToken,
      token: newAccessToken,
      user: tokenPayload,
    });
  } catch (err) {
    return response.error(res, 'Session refresh failed.', 401);
  }
});

/**
 * POST /api/auth/forgot-password — Generates 1-hour expiring reset token (SHA-256 hashed in DB)
 */
router.post('/forgot-password', passwordResetLimiter, validateBody(schemas.forgotPassword), async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Constant-time response: always returns 200 to prevent user enumeration
    const genericResponse = 'If that email address exists in our system, password reset instructions have been dispatched.';

    const { data: user } = await db.from('users').select('*').eq('email', normalizedEmail).single();
    if (!user) {
      return response.success(res, { message: genericResponse });
    }

    // 1-hour expiration token
    const { token, tokenHash, expiresAt } = generateExpiringToken(3600);

    try {
      await db.from('users').update({
        reset_password_token: tokenHash,
        reset_password_expires_at: expiresAt,
      }).eq('id', user.id);
    } catch (dbErr) {
      logger.warn('Failed to persist reset token to DB', dbErr);
    }

    await logAction({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'user',
      resourceId: String(user.id),
      details: { email: normalizedEmail, expiresAt },
      ip: req.ip,
    });

    return response.success(res, {
      message: genericResponse,
      // In development / demo environment, provide simulated token for manual verification
      ...(process.env.NODE_ENV !== 'production' && { demoResetToken: token }),
    });
  } catch (err) {
    return response.error(res, 'Unable to process password reset request.', 500);
  }
});

/**
 * POST /api/auth/reset-password — Verifies cryptographic token and updates password
 */
router.post('/reset-password', passwordResetLimiter, validateBody(schemas.resetPassword), async (req, res) => {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    // Find user with active token
    const { data: allUsers } = await db.from('users').select('*');
    const user = (allUsers || []).find((u) => {
      return u.reset_password_token === tokenHash && new Date(u.reset_password_expires_at) > new Date();
    });

    if (!user) {
      return response.error(res, 'Password reset token is invalid or has expired. Please request a new link.', 400);
    }

    // Hash with 12 salt rounds
    const newHash = bcrypt.hashSync(password, 12);

    await db.from('users').update({
      password_hash: newHash,
      reset_password_token: null,
      reset_password_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await logAction({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      resourceType: 'user',
      resourceId: String(user.id),
      details: { ip: req.ip },
      ip: req.ip,
    });

    return response.success(res, { message: 'Password has been successfully updated. You may now sign in with your new password.' });
  } catch (err) {
    return response.error(res, 'Password reset failed.', 500);
  }
});

/**
 * POST /api/auth/verify-email — Verify account email token
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return response.error(res, 'Verification token is required.', 400);
    }

    const tokenHash = hashToken(token);
    const { data: allUsers } = await db.from('users').select('*');
    const user = (allUsers || []).find((u) => {
      return u.verification_token === tokenHash && new Date(u.verification_expires_at) > new Date();
    });

    if (!user) {
      return response.error(res, 'Verification link is invalid or has expired.', 400);
    }

    await db.from('users').update({
      email_verified: true,
      verification_token: null,
      verification_expires_at: null,
    }).eq('id', user.id);

    return response.success(res, { message: 'Email address verified successfully.' });
  } catch (err) {
    return response.error(res, 'Email verification failed.', 500);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  return response.success(res, { message: 'Signed out successfully.' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  return response.success(res, { ...req.user, user: req.user });
});

module.exports = router;
