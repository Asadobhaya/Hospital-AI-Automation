// src/app.js — Express Application Setup
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const departmentRoutes = require('./routes/departments');
const reportRoutes = require('./routes/reports');
const feedbackRoutes = require('./routes/feedback');
const callRoutes = require('./routes/calls');
const escalationRoutes = require('./routes/escalations');
const messageRoutes = require('./routes/messages');
const webhookRoutes = require('./routes/webhooks');
const settingsRoutes = require('./routes/settings');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost in dev, vercel.app preview/production domains, or configured origin
    if (
      config.env === 'development' ||
      origin === config.cors.origin ||
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-webhook-signature']
}));

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logger
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

// Global API rate limiter (excluding webhooks & health checks)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks') || req.path === '/health') {
    return next();
  }
  return apiLimiter(req, res, next);
});

// Health checks
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// API route mounts
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Route Catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
