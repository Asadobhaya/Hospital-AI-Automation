// tests/unit/slotValidation.test.js — Unit Tests for Slot Validation & Double Booking Prevention
'use strict';

const appointmentService = require('../../src/services/appointmentService');
const db = require('../../src/db/dbAdapter');

describe('Appointment Service - Slot Validation & Double Booking', () => {
  let testDoctorId;

  beforeAll(async () => {
    // Retrieve a known doctor from seed data (Dr. Priya Sharma)
    const { data: doctors } = await db.from('doctors').select('*').limit(1);
    expect(doctors).toBeDefined();
    expect(doctors.length).toBeGreaterThan(0);
    testDoctorId = doctors[0].id;
  });

  test('Rejects booking in the past', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await expect(appointmentService.validateSlot(testDoctorId, pastDate))
      .rejects.toThrow('Cannot book an appointment in the past.');
  });

  test('Rejects invalid date string format', async () => {
    await expect(appointmentService.validateSlot(testDoctorId, 'not-a-valid-date'))
      .rejects.toThrow('Invalid slot_time format');
  });

  test('Rejects appointment outside doctor consulting hours (e.g. 02:00 AM)', async () => {
    // Find next valid Monday-Friday date at 02:00 AM
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    // ensure weekday
    while (targetDate.getDay() === 0) { // skip Sunday
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetDate.setHours(2, 0, 0, 0);

    await expect(appointmentService.validateSlot(testDoctorId, targetDate.toISOString()))
      .rejects.toThrow(/outside doctor's consulting hours/i);
  });

  test('Rejects appointment on doctor unavailable day (Sunday)', async () => {
    const targetDate = new Date();
    // set to next Sunday
    const daysUntilSunday = (7 - targetDate.getDay()) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + daysUntilSunday);
    targetDate.setHours(11, 0, 0, 0);

    await expect(appointmentService.validateSlot(testDoctorId, targetDate.toISOString()))
      .rejects.toThrow(/not available on Sundays/i);
  });

  test('Successfully books a valid future slot and prevents double booking', async () => {
    // Generate a unique future weekday slot
    const randomDays = 30 + Math.floor(Math.random() * 100);
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + randomDays);
    while (testDate.getDay() === 0) { // skip Sunday
      testDate.setDate(testDate.getDate() + 1);
    }
    testDate.setHours(11, 30, 0, 0);
    const slotIso = testDate.toISOString();

    const bookingResult = await appointmentService.bookAppointment({
      patientPhone: `+91998877${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: 'Test Booking Patient',
      doctorId: testDoctorId,
      slotTime: slotIso,
      source: 'unit_test',
      notes: 'Initial test appointment'
    });

    expect(bookingResult).toBeDefined();
    expect(bookingResult.appointment).toBeDefined();
    expect(bookingResult.appointment.doctor_id).toBe(testDoctorId);

    // Attempting to book the EXACT SAME slot must immediately fail with conflict error
    await expect(appointmentService.bookAppointment({
      patientPhone: '+919988776644',
      patientName: 'Conflicting Patient',
      doctorId: testDoctorId,
      slotTime: slotIso,
      source: 'unit_test'
    })).rejects.toThrow(/Time slot conflict/i);
  });
});
