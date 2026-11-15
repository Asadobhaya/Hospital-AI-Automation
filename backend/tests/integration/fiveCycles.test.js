// tests/integration/fiveCycles.test.js — 5 Full Cycles Stress & Regression Test
'use strict';

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db/dbAdapter');

describe('MediPulse AI: 5 Full Cycles Functional Regression Test', () => {
  let authToken;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hospital.test',
        password: 'Password@123',
      });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.data.accessToken;
    expect(authToken).toBeDefined();
  });

  // Run 5 sequential cycles
  for (let cycle = 1; cycle <= 5; cycle++) {
    describe(`Cycle #${cycle}: End-to-End Clinical Lifecycle Verification`, () => {
      let doctorId;
      let patientId;
      let appointmentId;
      let reportId;
      let reportToken;

      const testPhone = `030${cycle}123456${cycle}`;
      const e164Phone = `+9230${cycle}123456${cycle}`;

      // 1. Doctor Addition, Update & Removal
      test(`[Cycle ${cycle}] Step 1: Add new physician to roster`, async () => {
        const res = await request(app)
          .post('/api/doctors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Dr. Specialist Cycle ${cycle}`,
            department: 'Cardiology',
            fee: 2000 + cycle * 100,
            start_time: '09:00',
            end_time: '17:00',
            slot_duration_minutes: 30,
            available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        doctorId = res.body.data.id;
      });

      test(`[Cycle ${cycle}] Step 2: Update physician consulting parameters`, async () => {
        const res = await request(app)
          .put(`/api/doctors/${doctorId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fee: 3500 + cycle * 50,
            start_time: '08:30',
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      // 2. Patient Registration, Update & Fetching
      test(`[Cycle ${cycle}] Step 3: Register patient with Pakistani phone format`, async () => {
        const res = await request(app)
          .post('/api/patients')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Test Patient Cycle ${cycle}`,
            phone: testPhone,
            email: `patient${cycle}@cycle.test`,
            gender: cycle % 2 === 0 ? 'female' : 'male',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.phone).toBe(e164Phone);
        patientId = res.body.data.id;
      });

      test(`[Cycle ${cycle}] Step 4: Update patient demographics`, async () => {
        const res = await request(app)
          .put(`/api/patients/${patientId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Verified Patient Cycle ${cycle}`,
            email: `verified.patient${cycle}@cycle.test`,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      test(`[Cycle ${cycle}] Step 5: Retrieve patient profile and history`, async () => {
        const res = await request(app)
          .get(`/api/patients/${patientId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(`Verified Patient Cycle ${cycle}`);
      });

      // 3. Appointment Booking, Conflict Prevention, Reschedule & Cancel
      test(`[Cycle ${cycle}] Step 6: Book consultation slot for patient`, async () => {
        // Book for a future date (e.g. 10 + cycle days from now at 10:00)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 10 + cycle);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const slotTime = `${yyyy}-${mm}-${dd}T10:00:00Z`;

        const res = await request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            patientPhone: e164Phone,
            patientName: `Verified Patient Cycle ${cycle}`,
            doctorId,
            slotTime,
            notes: `Cycle ${cycle} Routine Consultation`,
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        appointmentId = res.body.data.appointment.id;
        expect(appointmentId).toBeDefined();

        // Sub-test: Attempt double booking same slot must fail
        const conflictRes = await request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            patientPhone: '+923009999999',
            patientName: 'Conflict Patient',
            doctorId,
            slotTime,
          });

        expect(conflictRes.status).toBe(400);
        expect(conflictRes.body.success).toBe(false);
      });

      test(`[Cycle ${cycle}] Step 7: Reschedule consultation to afternoon slot`, async () => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 10 + cycle);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const newSlotTime = `${yyyy}-${mm}-${dd}T14:30:00Z`;

        const res = await request(app)
          .post(`/api/appointments/${appointmentId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            newSlotTime,
            reason: `Cycle ${cycle} shift to afternoon`,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      test(`[Cycle ${cycle}] Step 8: Cancel consultation with reason`, async () => {
        const res = await request(app)
          .post(`/api/appointments/${appointmentId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: `Cycle ${cycle} patient schedule conflict`,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      // 4. Diagnostic Lab Reports: Create, Verify, Revoke
      test(`[Cycle ${cycle}] Step 9: Issue cryptographic diagnostic lab report`, async () => {
        const res = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            patientId,
            reportType: 'Complete Blood Count (CBC)',
            reportUrl: `https://storage.hospital.internal/reports/cbc_cycle_${cycle}.pdf`,
            doctorNotes: `Cycle ${cycle} parameters normal.`,
            isCritical: cycle % 2 === 0,
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.secureToken).toBeDefined();
        reportId = res.body.data.report.id;
        reportToken = res.body.data.secureToken;
      });

      test(`[Cycle ${cycle}] Step 10: Verify public report access via token`, async () => {
        const res = await request(app)
          .get(`/api/reports/view/${reportToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.reportType).toBe('Complete Blood Count (CBC)');
      });

      test(`[Cycle ${cycle}] Step 11: Revoke report access and confirm block`, async () => {
        const revokeRes = await request(app)
          .post(`/api/reports/${reportId}/revoke`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(revokeRes.status).toBe(200);
        expect(revokeRes.body.success).toBe(true);

        const verifyRevokedRes = await request(app)
          .get(`/api/reports/view/${reportToken}`);

        expect(verifyRevokedRes.status).toBe(403);
        expect(verifyRevokedRes.body.success).toBe(false);
      });

      // 5. Inbound Message Simulation & AI Concierge Screening
      test(`[Cycle ${cycle}] Step 12: Inbound message simulation with AI response`, async () => {
        const simRes = await request(app)
          .post('/api/messages/simulate-inbound')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            patientPhone: e164Phone,
            content: `Cycle ${cycle} Salam, I want to check appointment schedule`,
          });

        expect(simRes.status).toBe(201);
        expect(simRes.body.success).toBe(true);
        expect(simRes.body.data.reply).toBeDefined();
      });

      // 6. Cleanup & Deletion Verification
      test(`[Cycle ${cycle}] Step 13: Cleanly remove physician from roster`, async () => {
        const res = await request(app)
          .delete(`/api/doctors/${doctorId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      test(`[Cycle ${cycle}] Step 14: Cleanly remove test patient record`, async () => {
        const res = await request(app)
          .delete(`/api/patients/${patientId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  }
});
