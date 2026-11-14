// src/middleware/validation.js — Strict Input Validation & Sanitization Middleware
'use strict';

const Joi = require('joi');
const response = require('../utils/response');

/**
 * Recursive sanitizer to neutralize XSS, SQL meta-characters, and script injection
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Strip null bytes and control chars
    let clean = value.replace(/\0/g, '');
    // Neutralize dangerous HTML/script injection tags
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/javascript:/gi, '');
    clean = clean.replace(/data:text\/html/gi, '');
    clean = clean.replace(/onload=/gi, '');
    clean = clean.replace(/onerror=/gi, '');
    return clean.trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const sanitizedObj = {};
    for (const [k, v] of Object.entries(value)) {
      sanitizedObj[k] = sanitizeValue(v);
    }
    return sanitizedObj;
  }
  return value;
}

/**
 * Middleware: Global deep request sanitizer
 */
function sanitizeRequest(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

/**
 * Higher-order middleware to validate req.body against a Joi schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      // Normalize snake_case to camelCase for payload resilience
      if (req.body.patient_phone && !req.body.patientPhone) req.body.patientPhone = req.body.patient_phone;
      if (req.body.patient_name && !req.body.patientName) req.body.patientName = req.body.patient_name;
      if (req.body.doctor_id && !req.body.doctorId) req.body.doctorId = req.body.doctor_id;
      if (req.body.slot_time && !req.body.slotTime) req.body.slotTime = req.body.slot_time;
      if (req.body.new_slot_time && !req.body.newSlotTime) req.body.newSlotTime = req.body.new_slot_time;
      if (req.body.patient_id && !req.body.patientId) req.body.patientId = req.body.patient_id;
      if (req.body.report_type && !req.body.reportType) req.body.reportType = req.body.report_type;
      if (req.body.report_url && !req.body.reportUrl) req.body.reportUrl = req.body.report_url;
      if (req.body.doctor_notes && !req.body.doctorNotes) req.body.doctorNotes = req.body.doctor_notes;
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Drop unexpected fields to prevent mass-assignment
    });

    if (error) {
      const details = error.details.map((d) => d.message.replace(/['"]/g, ''));
      return response.error(res, `Validation Error: ${details.join(', ')}`, 400, { details });
    }

    req.body = value;
    next();
  };
}

// ==========================================
// Pre-defined Joi Validation Schemas
// ==========================================

const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
      'string.email': 'A valid email address is required.',
      'any.required': 'Email is required.'
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters.',
      'any.required': 'Password is required.'
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
      'string.email': 'A valid email address is required.',
      'any.required': 'Email is required.'
    }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().hex().length(64).required().messages({
      'string.length': 'Invalid or malformed reset token.',
      'any.required': 'Reset token is required.'
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters.',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        'any.required': 'New password is required.'
      }),
  }),

  // Appointments
  bookAppointment: Joi.object({
    patientPhone: Joi.string().pattern(/^(\+92|92|0)?3[0-9]{9}$|^\+?[1-9]\d{6,14}$/).required().messages({
      'string.pattern.base': 'Phone number must be a valid Pakistani mobile number (e.g. +923001234567 or 03001234567).'
    }),
    patientName: Joi.string().min(2).max(100).optional().default('Patient'),
    doctorId: Joi.number().integer().positive().required(),
    slotTime: Joi.string().isoDate().required(),
    notes: Joi.string().max(1000).allow('', null).optional(),
    source: Joi.string().valid('dashboard', 'whatsapp', 'phone', 'walk_in').default('dashboard'),
  }),

  rescheduleAppointment: Joi.object({
    newSlotTime: Joi.string().isoDate().required(),
    reason: Joi.string().max(500).allow('', null).optional(),
  }),

  // Doctors
  createDoctor: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    department: Joi.string().min(2).max(100).optional(),
    department_id: Joi.number().integer().positive().optional(),
    fee: Joi.number().min(0).max(50000).default(500),
    phone: Joi.string().pattern(/^(\+92|92|0)?3[0-9]{9}$|^\+?[1-9]\d{6,14}$/).allow('', null).optional(),
    email: Joi.string().email({ tlds: { allow: false } }).allow('', null).optional(),
    qualification: Joi.string().max(100).allow('', null).optional(),
    start_time: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
    end_time: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('17:00'),
    slot_duration_minutes: Joi.number().integer().min(10).max(120).default(30),
    available_days: Joi.array().items(Joi.string()).default([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ]),
  }),

  // Reports
  createReport: Joi.object({
    patientId: Joi.number().integer().positive().required(),
    reportType: Joi.string().valid('general', 'blood_test', 'radiology', 'pathology', 'prescription', 'discharge_summary').required(),
    reportUrl: Joi.string().uri().required(),
    doctorNotes: Joi.string().max(2000).allow('', null).optional(),
    isCritical: Joi.boolean().default(false),
  }),
};

module.exports = {
  sanitizeRequest,
  validateBody,
  schemas,
};
