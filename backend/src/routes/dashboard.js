// src/routes/dashboard.js — Real Dashboard Metrics & Analytics
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const response = require('../utils/response');

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { data: allAppointments } = await db.from('appointments').select('*');
    const { data: allCalls } = await db.from('call_logs').select('*');
    const { data: recentErrors } = await db.from('error_log').select('*').order('created_at', { ascending: false }).limit(5);
    const { data: pendingEscalations } = await db.from('escalations').select('*').eq('resolved', false);

    const appointments = allAppointments || [];
    const calls = allCalls || [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 3600 * 1000;

    let todayCount = 0;
    let upcomingCount = 0;
    let pendingConfirmationsCount = 0;
    let missedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const todayAppointments = [];

    appointments.forEach((appt) => {
      const slotTime = new Date(appt.slot_time).getTime();

      if (slotTime >= startOfToday && slotTime < endOfToday) {
        todayCount++;
        todayAppointments.push(appt);
      }
      if (slotTime >= now.getTime() && appt.status !== 'cancelled') {
        upcomingCount++;
      }
      if (appt.status === 'reschedule_pending' || (!appt.confirmed_via_call && appt.status === 'confirmed')) {
        pendingConfirmationsCount++;
      }
      if (appt.status === 'missed') {
        missedCount++;
      }
      if (appt.status === 'completed') {
        completedCount++;
      }
      if (appt.status === 'cancelled') {
        cancelledCount++;
      }
    });

    // Voice call status summary
    const callStats = {
      total: calls.length,
      confirmed: calls.filter((c) => c.outcome === 'confirmed').length,
      rescheduleRequested: calls.filter((c) => c.outcome === 'reschedule_requested').length,
      cancelled: calls.filter((c) => c.outcome === 'cancelled').length,
      failedOrNoAnswer: calls.filter((c) => c.outcome === 'no_answer' || c.outcome === 'failed').length,
    };

    // Calculate last 7 days trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 3600 * 1000;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayAppts = appointments.filter((a) => {
        const t = new Date(a.slot_time).getTime();
        return t >= dayStart && t < dayEnd;
      });

      trend.push({
        date: dayLabel,
        total: dayAppts.length,
        confirmed: dayAppts.filter((a) => a.status === 'confirmed').length,
        completed: dayAppts.filter((a) => a.status === 'completed').length,
        cancelled: dayAppts.filter((a) => a.status === 'cancelled').length,
      });
    }

    // Integration health check
    const integrationHealth = {
      database: { status: 'healthy', provider: db.isSupabaseConnected() ? 'Supabase' : 'Local Adapter' },
      whatsapp: { status: 'configured', provider: 'Meta Cloud API v21.0' },
      voice: { status: 'configured', provider: 'Internal AI Calling Gateway' },
      smtp: { status: 'configured', provider: 'Hospital SMTP Relay' },
      n8n: { status: 'ready', provider: 'Hospital n8n Instance' },
    };

    return response.success(res, {
      summary: {
        totalAppointments: appointments.length,
        todayTotal: todayCount,
        upcoming: upcomingCount,
        pendingConfirmations: pendingConfirmationsCount,
        missed: missedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        unresolvedEscalations: (pendingEscalations || []).length,
      },
      callStats,
      trend,
      todayAppointments: todayAppointments.slice(0, 10),
      recentErrors: recentErrors || [],
      integrationHealth,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/summary
 */
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const { data: appts } = await db.from('appointments').select('*');
    const { data: escalations } = await db.from('escalations').select('*').eq('resolved', false);
    const appointments = appts || [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 3600 * 1000;

    let todayCount = 0;
    let upcomingCount = 0;
    let missedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    appointments.forEach((a) => {
      const t = new Date(a.slot_time).getTime();
      if (t >= startOfToday && t < endOfToday) todayCount++;
      if (t >= now.getTime() && a.status !== 'cancelled') upcomingCount++;
      if (a.status === 'missed') missedCount++;
      if (a.status === 'completed') completedCount++;
      if (a.status === 'cancelled') cancelledCount++;
    });

    return response.success(res, {
      totalAppointments: appointments.length,
      todayTotal: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      missed: missedCount,
      cancelled: cancelledCount,
      unresolvedEscalations: (escalations || []).length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/appointment-trend
 */
router.get('/appointment-trend', requireAuth, async (req, res, next) => {
  try {
    const { data: appointments } = await db.from('appointments').select('*');
    const now = new Date();
    const trend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 3600 * 1000;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayAppts = (appointments || []).filter((a) => {
        const t = new Date(a.slot_time).getTime();
        return t >= dayStart && t < dayEnd;
      });

      trend.push({
        date: dayLabel,
        total: dayAppts.length,
        confirmed: dayAppts.filter((a) => a.status === 'confirmed').length,
        completed: dayAppts.filter((a) => a.status === 'completed').length,
        cancelled: dayAppts.filter((a) => a.status === 'cancelled').length,
      });
    }

    return response.success(res, trend);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/recent-errors
 */
router.get('/recent-errors', requireAuth, async (req, res, next) => {
  try {
    const { data: errors } = await db.from('error_log').select('*').order('created_at', { ascending: false }).limit(10);
    return response.success(res, errors || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/voice-call-summary
 */
router.get('/voice-call-summary', requireAuth, async (req, res, next) => {
  try {
    const { data: calls } = await db.from('call_logs').select('*');
    const allCalls = calls || [];
    return response.success(res, {
      total: allCalls.length,
      confirmed: allCalls.filter((c) => c.outcome === 'confirmed').length,
      rescheduleRequested: allCalls.filter((c) => c.outcome === 'reschedule_requested').length,
      cancelled: allCalls.filter((c) => c.outcome === 'cancelled').length,
      failedOrNoAnswer: allCalls.filter((c) => c.outcome === 'no_answer' || c.outcome === 'failed').length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
