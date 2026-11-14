// src/routes/feedback.js — Patient Experience & Reviews API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const feedbackService = require('../services/feedbackService');
const response = require('../utils/response');

/**
 * GET /api/feedback — List all feedback records
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { minRating, maxRating, rating } = req.query;

    const { data: allFeedback } = await db.from('feedback').select('*').order('created_at', { ascending: false });
    let filtered = allFeedback || [];

    if (rating) {
      filtered = filtered.filter((f) => f.rating === parseInt(rating, 10));
    }
    if (minRating) {
      filtered = filtered.filter((f) => f.rating >= parseInt(minRating, 10));
    }
    if (maxRating) {
      filtered = filtered.filter((f) => f.rating <= parseInt(maxRating, 10));
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return response.success(res, paginated, 200, response.buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/feedback — Submit patient feedback
 */
router.post('/', async (req, res, next) => {
  try {
    const { appointmentId, patientPhone, rating, comment } = req.body;
    if (!rating) {
      return response.error(res, 'Rating (1 to 5) is required.', 400);
    }

    const result = await feedbackService.processFeedback({
      appointmentId: appointmentId ? parseInt(appointmentId, 10) : null,
      patientPhone,
      rating,
      comment,
      ip: req.ip,
    });

    return response.success(res, result, 201);
  } catch (err) {
    return response.error(res, err.message, 400);
  }
});

/**
 * GET /api/feedback/export — Export CSV
 */
router.get('/export', requireAuth, async (req, res, next) => {
  try {
    const { data: feedbackList } = await db.from('feedback').select('*').order('created_at', { ascending: false });
    const rows = (feedbackList || []).map((f) => {
      return `"${f.id}","${f.appointment_id || ''}","${f.patient_phone || ''}","${f.rating || ''}","${(f.comment || '').replace(/"/g, '""')}","${f.created_at}"`;
    });
    const csv = ['"ID","AppointmentID","PatientPhone","Rating","Comment","CreatedAt"', ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feedback_export.csv"');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
