import { describe, it, expect } from 'vitest';
import { calculateHviMetrics, ScorableDelivery } from './scoring';

describe('CyberShield Human Vulnerability Index (HVI) Engine', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const pastDate = new Date(Date.now() - 86400000).toISOString();

  it('produces exactly HVI 42 for 1 click, 1 report, and 1 open-only delivery', () => {
    const deliveries: ScorableDelivery[] = [
      { id: '1', response_deadline: futureDate, hasClick: true, hasReport: false, hasOpen: true }, // 100 pts
      { id: '2', response_deadline: futureDate, hasClick: false, hasReport: true, hasOpen: true }, // 0 pts
      { id: '3', response_deadline: futureDate, hasClick: false, hasReport: false, hasOpen: true }, // 25 pts
    ];

    const metrics = calculateHviMetrics(deliveries);

    expect(metrics.eligibleCount).toBe(3);
    // (100 + 0 + 25) / 3 = 125 / 3 = 41.666... -> Math.round -> 42
    expect(metrics.hvi).toBe(42);
    expect(metrics.hviLabel).toBe('42');
    expect(metrics.clickedCount).toBe(1);
    expect(metrics.reportedCount).toBe(1);
    expect(metrics.openedOnlyCount).toBe(1);
  });

  it('excludes pending untouched deliveries from HVI calculation', () => {
    const deliveries: ScorableDelivery[] = [
      { id: '1', response_deadline: futureDate, hasClick: true, hasReport: false, hasOpen: true }, // 100 pts
      { id: '2', response_deadline: futureDate, hasClick: false, hasReport: false, hasOpen: false }, // pending untouched -> excluded!
    ];

    const metrics = calculateHviMetrics(deliveries);

    expect(metrics.launchedCount).toBe(2);
    expect(metrics.pendingUntouchedCount).toBe(1);
    expect(metrics.eligibleCount).toBe(1);
    expect(metrics.hvi).toBe(100);
  });

  it('includes expired untouched deliveries with 0 risk points', () => {
    const deliveries: ScorableDelivery[] = [
      { id: '1', response_deadline: pastDate, hasClick: false, hasReport: false, hasOpen: false }, // expired untouched -> 0 pts
      { id: '2', response_deadline: futureDate, hasClick: true, hasReport: false, hasOpen: true }, // 100 pts
    ];

    const metrics = calculateHviMetrics(deliveries);

    expect(metrics.eligibleCount).toBe(2);
    expect(metrics.expiredUntouchedCount).toBe(1);
    expect(metrics.hvi).toBe(50); // (0 + 100) / 2 = 50
  });

  it('gives precedence to click even if also reported', () => {
    const deliveries: ScorableDelivery[] = [
      { id: '1', response_deadline: futureDate, hasClick: true, hasReport: true, hasOpen: true }, // click takes precedence -> 100 pts
    ];

    const metrics = calculateHviMetrics(deliveries);

    expect(metrics.eligibleCount).toBe(1);
    expect(metrics.clickedCount).toBe(1);
    expect(metrics.hvi).toBe(100);
  });

  it('returns "Insufficient data" when eligible count is zero', () => {
    const deliveries: ScorableDelivery[] = [
      { id: '1', response_deadline: futureDate, hasClick: false, hasReport: false, hasOpen: false }, // unexpired untouched
    ];

    const metrics = calculateHviMetrics(deliveries);

    expect(metrics.eligibleCount).toBe(0);
    expect(metrics.hvi).toBeNull();
    expect(metrics.hviLabel).toBe('Insufficient data');
  });
});
