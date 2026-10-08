import { describe, it, expect } from 'vitest';
import {
  SAMPLE_DAILY_OUTCOMES,
  SAMPLE_COMBINED_DAILY,
  PAYROLL_SAMPLE_SUMMARY,
  ENGINEERING_SAMPLE_SUMMARY,
  ORGANIZATION_SAMPLE_SUMMARY,
  calculateCohortHvi,
} from './sample-analytics';

describe('Sample Analytics Arithmetic Verification', () => {
  it('verifies each daily outcome stack equals 20 deliveries', () => {
    for (const row of SAMPLE_DAILY_OUTCOMES) {
      const sum = row.clicked + row.reported + row.openedOnly + row.expiredUntouched;
      expect(sum).toBe(20);
      expect(row.delivered).toBe(20);
    }
  });

  it('verifies department totals each equal 140 deliveries', () => {
    const payrollRows = SAMPLE_DAILY_OUTCOMES.filter((r) => r.department === 'Payroll');
    const engineeringRows = SAMPLE_DAILY_OUTCOMES.filter((r) => r.department === 'Engineering');

    const pDelivered = payrollRows.reduce((acc, r) => acc + r.delivered, 0);
    const eDelivered = engineeringRows.reduce((acc, r) => acc + r.delivered, 0);

    expect(pDelivered).toBe(140);
    expect(eDelivered).toBe(140);
    expect(PAYROLL_SAMPLE_SUMMARY.eligibleDeliveries).toBe(140);
    expect(ENGINEERING_SAMPLE_SUMMARY.eligibleDeliveries).toBe(140);
  });

  it('verifies organization total equals 280 deliveries', () => {
    const orgDelivered = SAMPLE_COMBINED_DAILY.reduce((acc, r) => acc + r.delivered, 0);
    expect(orgDelivered).toBe(280);
    expect(ORGANIZATION_SAMPLE_SUMMARY.eligibleDeliveries).toBe(280);
  });

  it('verifies Payroll 7-day HVI equals 29', () => {
    const payrollRows = SAMPLE_DAILY_OUTCOMES.filter((r) => r.department === 'Payroll');
    const clicks = payrollRows.reduce((acc, r) => acc + r.clicked, 0);
    const opens = payrollRows.reduce((acc, r) => acc + r.openedOnly, 0);
    const reports = payrollRows.reduce((acc, r) => acc + r.reported, 0);
    const expired = payrollRows.reduce((acc, r) => acc + r.expiredUntouched, 0);

    expect(clicks).toBe(35);
    expect(reports).toBe(65);
    expect(opens).toBe(24);
    expect(expired).toBe(16);

    const calculatedHvi = calculateCohortHvi(clicks, opens, 140);
    expect(calculatedHvi).toBe(29);
    expect(PAYROLL_SAMPLE_SUMMARY.hvi).toBe(29);
    expect(PAYROLL_SAMPLE_SUMMARY.clickRate).toBe(25);
    expect(PAYROLL_SAMPLE_SUMMARY.responseCoverage).toBe(88.6);
  });

  it('verifies Engineering 7-day HVI equals 19', () => {
    const engineeringRows = SAMPLE_DAILY_OUTCOMES.filter((r) => r.department === 'Engineering');
    const clicks = engineeringRows.reduce((acc, r) => acc + r.clicked, 0);
    const opens = engineeringRows.reduce((acc, r) => acc + r.openedOnly, 0);
    const reports = engineeringRows.reduce((acc, r) => acc + r.reported, 0);
    const expired = engineeringRows.reduce((acc, r) => acc + r.expiredUntouched, 0);

    expect(clicks).toBe(21);
    expect(reports).toBe(81);
    expect(opens).toBe(21);
    expect(expired).toBe(17);

    const calculatedHvi = calculateCohortHvi(clicks, opens, 140);
    expect(calculatedHvi).toBe(19);
    expect(ENGINEERING_SAMPLE_SUMMARY.hvi).toBe(19);
    expect(ENGINEERING_SAMPLE_SUMMARY.clickRate).toBe(15);
    expect(ENGINEERING_SAMPLE_SUMMARY.responseCoverage).toBe(87.9);
  });

  it('verifies Combined organization totals and metrics', () => {
    expect(ORGANIZATION_SAMPLE_SUMMARY.eligibleDeliveries).toBe(280);
    expect(ORGANIZATION_SAMPLE_SUMMARY.clicked).toBe(56);
    expect(ORGANIZATION_SAMPLE_SUMMARY.reported).toBe(146);
    expect(ORGANIZATION_SAMPLE_SUMMARY.openedOnly).toBe(45);
    expect(ORGANIZATION_SAMPLE_SUMMARY.expiredUntouched).toBe(33);
    expect(ORGANIZATION_SAMPLE_SUMMARY.clickRate).toBe(20);
    expect(ORGANIZATION_SAMPLE_SUMMARY.responseCoverage).toBe(88.2);
    expect(ORGANIZATION_SAMPLE_SUMMARY.overallHvi).toBe(26);
  });
});
