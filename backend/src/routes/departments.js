// src/routes/departments.js — Departments API
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/dbAdapter');
const { requireAuth } = require('../middleware/auth');
const response = require('../utils/response');

/**
 * GET /api/departments
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: departments } = await db.from('departments').select('*').eq('is_active', true);
    return response.success(res, departments || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
