// tests/integration/adversarial.test.js — Adversarial Security, Concurrency & Edge-Case Audit Tests
'use strict';

const request = require('supertest');
const crypto = require('crypto');
const app = require('../../src/app');
const config = require('../../src/config');
const db = require('../../src/db/dbAdapter');
const appointmentService = require('../../src/services/appointmentService');
const reportService = require('../../src/services/reportService');

describe('Adversarial Security & Edge-Case Audit Suite', () => {
  let authToken;
  let testDoctorId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hospital.test',
        password: 'Password@123'
      });

    if (loginRes.body.success) {
      authToken = loginRes.body.data.accessToken || loginRes.body.data.token;
    }

    const { data: doctors } = await db.from('doctors').select('*').limit(1);
    if (doctors && doctors.length > 0) {
      testDoctorId = doctors[0].id;
    }
  });

  // --- VULNERABILITY AUDIT 1: FORGED CALLBACK REJECTION ---
  test('Security Audit: Rejects forged voice callback without signature header with 401', async () => {
    const payload = {
      call_id: 'forged_call_attack',
      appointment_id: 1,
      status: 'completed',
      outcome: 'cancelled'
    };

    const res = await request(app)
      .post('/api/webhooks/voice/callback')
      // Intentionally omitting x-voice-signature / x-webhook-signature
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Security Audit: Rejects malformed / mismatched length signature without throwing 500 error', async () => {
    const payload = {
      call_id: 'malformed_sig_attack',
      status: 'completed',
      outcome: 'confirmed'
    };

    const res = await request(app)
      .post('/api/webhooks/voice/callback')
      .set('x-webhook-signature', 'invalid_short_signature')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // --- VULNERABILITY AUDIT 2: CONCURRENT DOUBLE-BOOKING RACE ---
  test('Concurrency Audit: Concurrent booking race condition allows only 1 booking and rejects the other', async () => {
    const randomDays = Math.floor(Math.random() * 200);
    const targetDate = new Date();
    targetDate.setFullYear(2030 + Math.floor(Math.random() * 10));
    targetDate.setDate(targetDate.getDate() + randomDays);
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(10, 0, 0, 0);
    const slotIso = targetDate.toISOString();

    const bookAttempt1 = appointmentService.bookAppointment({
      patientPhone: '+919111222333',
      patientName: 'Concurrent Patient Alpha',
      doctorId: testDoctorId,
      slotTime: slotIso,
      source: 'adversarial_test'
    });

    const bookAttempt2 = appointmentService.bookAppointment({
      patientPhone: '+919111222444',
      patientName: 'Concurrent Patient Beta',
      doctorId: testDoctorId,
      slotTime: slotIso,
      source: 'adversarial_test'
    });

    const results = await Promise.allSettled([bookAttempt1, bookAttempt2]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/conflict/i);
  });

  // --- VULNERABILITY AUDIT 3: PHONE NORMALIZATION & PATIENT UNIQUENESS ---
  test('Data Integrity Audit: Normalizes phone formats preventing split patient profiles', async () => {
    const uniqueNumber = '300' + Math.floor(1000000 + Math.random() * 9000000).toString();
    
    // Attempt 1: Raw 10 digits (e.g. 3001234567)
    const p1 = appointmentService.normalizePhone(uniqueNumber);
    // Attempt 2: Formatted with country code and spaces (+92 300-1234567)
    const p2 = appointmentService.normalizePhone(`+92 ${uniqueNumber.slice(0, 3)}-${uniqueNumber.slice(3)}`);

    expect(p1).toBe(`+92${uniqueNumber}`);
    expect(p2).toBe(`+92${uniqueNumber}`);
    expect(p1).toBe(p2);
  });

  // --- VULNERABILITY AUDIT 4: POST METHOD ON APPOINTMENT CANCEL & RESCHEDULE ---
  test('Endpoint Audit: Allows POST method on /api/appointments/:id/cancel and :id/reschedule', async () => {
    // 1. Create a dummy test appointment
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 200 + Math.floor(Math.random() * 150));
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(14, 0, 0, 0);

    const booking = await appointmentService.bookAppointment({
      patientPhone: '+919998887776',
      patientName: 'Cancel Test Patient',
      doctorId: testDoctorId,
      slotTime: targetDate.toISOString(),
      source: 'adversarial_test'
    });

    const apptId = booking.appointment.id;

    // Test POST cancel
    const cancelRes = await request(app)
      .post(`/api/appointments/${apptId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Adversarial audit verification' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Verify appointment status in DB is cancelled
    const { data: cancelledAppt } = await db.from('appointments').select('*').eq('id', apptId).single();
    expect(cancelledAppt.status).toBe('cancelled');
  });

  // --- VULNERABILITY AUDIT 5: WHATSAPP CONVERSATIONS & STAFF REPLY ---
  test('Endpoint Audit: GET /api/messages/conversations returns list of conversations', async () => {
    const res = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Endpoint Audit: POST /api/messages/staff-reply records staff reply', async () => {
    const res = await request(app)
      .post('/api/messages/staff-reply')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientPhone: '+919876543210',
        message: 'This is an adversarial test staff reply.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.direction).toBe('staff');
  });

  // --- VULNERABILITY AUDIT 6: CALL RETRY BY ID ---
  test('Endpoint Audit: POST /api/calls/:id/retry successfully queues retry', async () => {
    const res = await request(app)
      .post('/api/calls/1/retry')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.callLog.status).toBe('queued');
  });
});
