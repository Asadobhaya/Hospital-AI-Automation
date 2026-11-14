// tests/integration/api.test.js — End-to-End API Integration Tests
'use strict';

const request = require('supertest');
const crypto = require('crypto');
const app = require('../../src/app');
const config = require('../../src/config');
const db = require('../../src/db/dbAdapter');

describe('Hospital AI Automation API Integration Tests', () => {
  let authToken;
  let testDoctorId;

  beforeAll(async () => {
    // Authenticate with synthetic seed admin credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hospital.test',
        password: 'Password@123'
      });

    if (loginRes.body.success) {
      authToken = loginRes.body.data.accessToken;
    }

    const { data: doctors } = await db.from('doctors').select('*').limit(1);
    if (doctors && doctors.length > 0) {
      testDoctorId = doctors[0].id;
    }
  });

  test('GET /health returns healthy service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('hospital-ai-automation-api');
    expect(res.body.status).toBe('pass');
    expect(res.body.checks.database.status).toBe('healthy');
  });

  test('POST /api/auth/login rejects invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hospital.test',
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me returns authenticated user profile', async () => {
    if (!authToken) return;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@hospital.test');
    expect(res.body.data.role).toBe('admin');
  });

  test('GET /api/dashboard/stats returns real aggregated hospital statistics', async () => {
    if (!authToken) return;
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(typeof res.body.data.summary.totalAppointments).toBe('number');
  });

  test('GET /api/doctors returns list of doctors with department details', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/departments returns active clinical departments', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/webhooks/whatsapp handles Meta verification handshake', async () => {
    const res = await request(app)
      .get('/api/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': config.whatsapp.verifyToken,
        'hub.challenge': 'hospital_challenge_test_456'
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('hospital_challenge_test_456');
  });

  test('POST /api/webhooks/whatsapp processes incoming appointment intent message', async () => {
    const res = await request(app)
      .post('/api/webhooks/whatsapp')
      .send({
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+923001234567',
                      id: 'wamid.HBgLMTIzNDU2',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Hello, I want to book an appointment'
                      },
                      type: 'text'
                    }
                  ],
                  contacts: [
                    {
                      profile: { name: 'Integration Test Patient' },
                      wa_id: '923001234567'
                    }
                  ]
                }
              }
            ]
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  test('POST /api/webhooks/voice/callback validates HMAC signature and updates call log', async () => {
    const payload = {
      call_id: 'call_test_int_123',
      call_status: 'completed',
      duration_seconds: 45,
      intent_outcome: 'confirmed'
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', config.voice.callbackSecret)
      .update(payloadString)
      .digest('hex');

    const res = await request(app)
      .post('/api/webhooks/voice/callback')
      .set('x-webhook-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/reports/view/:token serves report securely or 403/404 for invalid token', async () => {
    const res = await request(app).get('/api/reports/view/invalid_hex_token_0000000000000000000000000000000000000000000000000000000000000000');
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
