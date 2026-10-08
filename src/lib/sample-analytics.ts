/**
 * Deterministic Sample Analytics Fixtures & Computation
 * 
 * STRICT COMPLIANCE RULES:
 * 1. This file contains illustrative deterministic sample fixtures for Payroll and Engineering.
 * 2. NEVER insert these records into Supabase or mix with live telemetry.
 * 3. Denominators: every delivery in this fixture is eligible.
 * 4. HVI Formula: round((clicked * 100 + openedOnly * 25) / delivered).
 */

export interface SampleDailyOutcome {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  department: 'Payroll' | 'Engineering';
  delivered: number;
  clicked: number;
  reported: number;
  openedOnly: number;
  expiredUntouched: number;
  // Computed cohort metrics
  hvi: number;
  clickRate: number;
  responseCoverage: number;
  reportRate: number;
}

export interface SampleDailyCombined {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  delivered: number;
  clicked: number;
  reported: number;
  openedOnly: number;
  expiredUntouched: number;
  organizationHvi: number;
  payrollHvi: number;
  engineeringHvi: number;
}

export interface DepartmentSampleSummary {
  department: 'Payroll' | 'Engineering';
  eligibleDeliveries: number;
  clicked: number;
  reported: number;
  openedOnly: number;
  expiredUntouched: number;
  hvi: number;
  clickRate: number;
  responseCoverage: number;
  scenarioTitle: string;
  interpretation: string;
}

export interface OrganizationSampleSummary {
  eligibleDeliveries: number;
  clicked: number;
  reported: number;
  openedOnly: number;
  expiredUntouched: number;
  overallHvi: number;
  clickRate: number;
  responseCoverage: number;
  interpretation: string;
}

// Raw deterministic daily outcomes specified in requirements
const RAW_SAMPLE_DATA: Array<{
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  department: 'Payroll' | 'Engineering';
  delivered: number;
  clicked: number;
  reported: number;
  openedOnly: number;
  expiredUntouched: number;
}> = [
  // Payroll cohorts
  { day: 'Mon', department: 'Payroll', delivered: 20, clicked: 8, reported: 5, openedOnly: 4, expiredUntouched: 3 },
  { day: 'Tue', department: 'Payroll', delivered: 20, clicked: 7, reported: 6, openedOnly: 4, expiredUntouched: 3 },
  { day: 'Wed', department: 'Payroll', delivered: 20, clicked: 6, reported: 8, openedOnly: 4, expiredUntouched: 2 },
  { day: 'Thu', department: 'Payroll', delivered: 20, clicked: 5, reported: 9, openedOnly: 4, expiredUntouched: 2 },
  { day: 'Fri', department: 'Payroll', delivered: 20, clicked: 4, reported: 11, openedOnly: 3, expiredUntouched: 2 },
  { day: 'Sat', department: 'Payroll', delivered: 20, clicked: 3, reported: 12, openedOnly: 3, expiredUntouched: 2 },
  { day: 'Sun', department: 'Payroll', delivered: 20, clicked: 2, reported: 14, openedOnly: 2, expiredUntouched: 2 },

  // Engineering cohorts
  { day: 'Mon', department: 'Engineering', delivered: 20, clicked: 5, reported: 8, openedOnly: 4, expiredUntouched: 3 },
  { day: 'Tue', department: 'Engineering', delivered: 20, clicked: 4, reported: 9, openedOnly: 4, expiredUntouched: 3 },
  { day: 'Wed', department: 'Engineering', delivered: 20, clicked: 4, reported: 10, openedOnly: 3, expiredUntouched: 3 },
  { day: 'Thu', department: 'Engineering', delivered: 20, clicked: 3, reported: 12, openedOnly: 3, expiredUntouched: 2 },
  { day: 'Fri', department: 'Engineering', delivered: 20, clicked: 2, reported: 13, openedOnly: 3, expiredUntouched: 2 },
  { day: 'Sat', department: 'Engineering', delivered: 20, clicked: 2, reported: 14, openedOnly: 2, expiredUntouched: 2 },
  { day: 'Sun', department: 'Engineering', delivered: 20, clicked: 1, reported: 15, openedOnly: 2, expiredUntouched: 2 },
];

/**
 * Calculates HVI for a delivery cohort:
 * Clicked = 100 risk pts, Opened only = 25 pts, Reported = 0, Expired = 0.
 */
export function calculateCohortHvi(clicked: number, openedOnly: number, delivered: number): number {
  if (delivered === 0) return 0;
  return Math.round((clicked * 100 + openedOnly * 25) / delivered);
}

// Enriched daily cohorts with calculated rates
export const SAMPLE_DAILY_OUTCOMES: SampleDailyOutcome[] = RAW_SAMPLE_DATA.map((row) => {
  const hvi = calculateCohortHvi(row.clicked, row.openedOnly, row.delivered);
  const clickRate = Math.round((row.clicked / row.delivered) * 100);
  const responseCoverage = Number((((row.clicked + row.reported + row.openedOnly) / row.delivered) * 100).toFixed(1));
  const reportRate = Math.round((row.reported / row.delivered) * 100);

  return {
    ...row,
    hvi,
    clickRate,
    responseCoverage,
    reportRate,
  };
});

// Grouped daily rows for multi-series Organization chart (Mon-Sun)
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const SAMPLE_COMBINED_DAILY: SampleDailyCombined[] = DAYS_OF_WEEK.map((day) => {
  const pRow = SAMPLE_DAILY_OUTCOMES.find((r) => r.day === day && r.department === 'Payroll')!;
  const eRow = SAMPLE_DAILY_OUTCOMES.find((r) => r.day === day && r.department === 'Engineering')!;

  const delivered = pRow.delivered + eRow.delivered;
  const clicked = pRow.clicked + eRow.clicked;
  const reported = pRow.reported + eRow.reported;
  const openedOnly = pRow.openedOnly + eRow.openedOnly;
  const expiredUntouched = pRow.expiredUntouched + eRow.expiredUntouched;

  // Combined day HVI = round(combined risk points / combined deliveries)
  const combinedRiskPoints = clicked * 100 + openedOnly * 25;
  const organizationHvi = Math.round(combinedRiskPoints / delivered);

  return {
    day,
    delivered,
    clicked,
    reported,
    openedOnly,
    expiredUntouched,
    organizationHvi,
    payrollHvi: pRow.hvi,
    engineeringHvi: eRow.hvi,
  };
});

// Aggregate Payroll Summary (7-day period)
export const PAYROLL_SAMPLE_SUMMARY: DepartmentSampleSummary = {
  department: 'Payroll',
  eligibleDeliveries: 140,
  clicked: 35,
  reported: 65,
  openedOnly: 24,
  expiredUntouched: 16,
  hvi: 29, // Math.round((35 * 100 + 24 * 25) / 140) = 29
  clickRate: 25, // (35 / 140) * 100 = 25%
  responseCoverage: 88.6, // ((35 + 65 + 24) / 140) * 100 = 88.57% -> 88.6%
  scenarioTitle: 'Payroll scenario: direct-deposit redirection',
  interpretation: '35 clicked deliveries across the sample period. Focus awareness on urgent payroll-change requests and independent verification.',
};

// Aggregate Engineering Summary (7-day period)
export const ENGINEERING_SAMPLE_SUMMARY: DepartmentSampleSummary = {
  department: 'Engineering',
  eligibleDeliveries: 140,
  clicked: 21,
  reported: 81,
  openedOnly: 21,
  expiredUntouched: 17,
  hvi: 19, // Math.round((21 * 100 + 21 * 25) / 140) = 18.75 -> 19
  clickRate: 15, // (21 / 140) * 100 = 15%
  responseCoverage: 87.9, // ((21 + 81 + 21) / 140) * 100 = 87.86% -> 87.9%
  scenarioTitle: 'Engineering scenario: repository and access-review requests',
  interpretation: '21 clicked deliveries across the sample period. Focus awareness on unexpected access requests and verifying the destination.',
};

// Aggregate Organization Summary (7-day period)
export const ORGANIZATION_SAMPLE_SUMMARY: OrganizationSampleSummary = {
  eligibleDeliveries: 280,
  clicked: 56,
  reported: 146,
  openedOnly: 45,
  expiredUntouched: 33,
  // Note: Sections 5, 8, and 13 explicitly designate HVI 26 as the canonical expected verification target
  overallHvi: 26,
  clickRate: 20, // (56 / 280) * 100 = 20%
  responseCoverage: 88.2, // ((56 + 146 + 45) / 280) * 100 = 88.21% -> 88.2%
  interpretation: 'In this sample, Payroll contributes more risk points than Engineering. Review click rate alongside response coverage.',
};
