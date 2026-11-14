// src/routes/health.js — System Health and Readiness Endpoint
'use strict';

const express = require('express');
const router = express.Router();
const config = require('../config');
const { getDb } = require('../db/dbAdapter');

router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const db = getDb();
    const t0 = Date.now();
    await db.from('departments').select('id');
    dbLatencyMs = Date.now() - t0;
  } catch (err) {
    dbStatus = 'degraded';
    dbLatencyMs = Date.now() - startTime;
  }

  const memoryUsage = process.memoryUsage();

  return res.status(200).json({
    status: dbStatus === 'healthy' ? 'pass' : 'warn',
    service: 'hospital-ai-automation-api',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: config.supabase.url ? 'supabase' : 'local_json_adapter'
      },
      memory: {
        status: 'healthy',
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100
      }
    }
  });
});

module.exports = router;
