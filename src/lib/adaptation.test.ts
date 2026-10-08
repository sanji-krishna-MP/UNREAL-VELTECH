import { describe, it, expect } from 'vitest';
import { getAdaptedRecommendation } from './adaptation';

describe('CyberShield Rule-Based Campaign Adaptation Engine', () => {
  it('proposes introductory baseline when no failure recorded', () => {
    const res = getAdaptedRecommendation('payroll_direct_deposit', undefined);
    expect(res.suggestedDifficulty).toBe('introductory');
    expect(res.explanation).toContain('Introductory baseline');
  });

  it('retains introductory difficulty when previous failure training is unfinished', () => {
    const res = getAdaptedRecommendation('payroll_direct_deposit', {
      hasClickedPrevious: true,
      previousScenario: 'payroll_direct_deposit',
      hasCompletedTraining: false,
    });
    expect(res.suggestedDifficulty).toBe('introductory');
    expect(res.explanation).toContain('training remains pending');
  });

  it('advances to intermediate difficulty when previous failure training is completed', () => {
    const res = getAdaptedRecommendation('engineering_repo_access', {
      hasClickedPrevious: true,
      previousScenario: 'engineering_repo_access',
      hasCompletedTraining: true,
    });
    expect(res.suggestedDifficulty).toBe('intermediate');
    expect(res.explanation).toContain('verified micro-training completion');
  });
});
