// tests/unit/reportTokens.test.js — Unit Tests for Secure Report Tokens & Expiration
'use strict';

const reportService = require('../../src/services/reportService');
const db = require('../../src/db/dbAdapter');

describe('Report Service - Cryptographic Token & Expiration', () => {
  let testPatientId;

  beforeAll(async () => {
    const { data: patients } = await db.from('patients').select('*').limit(1);
    expect(patients.length).toBeGreaterThan(0);
    testPatientId = patients[0].id;
  });

  test('Generates cryptographically random 32-byte hex token (64 characters)', () => {
    const token1 = reportService.generateReportToken();
    const token2 = reportService.generateReportToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(token1)).toBe(true);
    expect(/^[0-9a-f]{64}$/.test(token2)).toBe(true);
    expect(token1).not.toBe(token2);
  });

  test('Creates a report with 7-day expiry and allows access via secure token', async () => {
    const reportData = await reportService.createReport({
      patientId: testPatientId,
      reportType: 'Complete Blood Count (CBC)',
      reportUrl: 'https://storage.hospital.test/reports/cbc_test_sample.pdf',
      doctorNotes: 'WBC within normal range',
      isCritical: false
    });

    expect(reportData).toBeDefined();
    expect(reportData.report).toBeDefined();
    expect(reportData.secureToken).toHaveLength(64);

    const expiresAt = new Date(reportData.report.expires_at).getTime();
    const createdAt = new Date(reportData.report.created_at).getTime();
    const diffDays = Math.round((expiresAt - createdAt) / (1000 * 3600 * 24));
    expect(diffDays).toBe(7);

    // Verify retrieval by token
    const fetched = await reportService.getReportByToken(reportData.secureToken);
    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(reportData.report.id);
    expect(fetched.access_count).toBe(1);
  });

  test('Revoking a report denies access', async () => {
    const reportData = await reportService.createReport({
      patientId: testPatientId,
      reportType: 'Lipid Profile',
      reportUrl: 'https://storage.hospital.test/reports/lipid_sample.pdf',
    });

    // Revoke
    await reportService.revokeReport(reportData.report.id, 'Test revocation');

    // Attempt retrieval by token
    await expect(reportService.getReportByToken(reportData.secureToken))
      .rejects.toThrow(/revoked by hospital staff/i);
  });

  test('Rejects invalid or non-existent token', async () => {
    await expect(reportService.getReportByToken('non_existent_token_1234567890abcdef'))
      .rejects.toThrow(/Report not found or invalid token/i);
  });
});
