import { HviMetrics } from './types';

export interface ScorableDelivery {
  id: string;
  response_deadline: string; // ISO string
  hasClick: boolean;
  hasReport: boolean;
  hasOpen: boolean;
}

export interface TrainingStats {
  totalAssignments: number;
  completedAssignments: number;
}

/**
 * Calculates the Human Vulnerability Index (HVI) and response metrics
 * strictly following PRD Section 7 rules.
 */
export function calculateHviMetrics(
  deliveries: ScorableDelivery[],
  trainingStats: TrainingStats = { totalAssignments: 0, completedAssignments: 0 },
  now: Date = new Date()
): HviMetrics {
  const launchedCount = deliveries.length;
  let interactionCount = 0;
  let eligibleCount = 0;

  let clickedCount = 0;
  let reportedCount = 0;
  let openedOnlyCount = 0;
  let expiredUntouchedCount = 0;
  let pendingUntouchedCount = 0;

  let totalRiskPoints = 0;

  for (const delivery of deliveries) {
    const hasInteraction = delivery.hasClick || delivery.hasReport || delivery.hasOpen;
    if (hasInteraction) {
      interactionCount++;
    }

    const isExpired = new Date(delivery.response_deadline).getTime() <= now.getTime();

    // Eligible condition: has at least one interaction OR has passed deadline
    if (!hasInteraction && !isExpired) {
      pendingUntouchedCount++;
      continue; // Exclude unexpired untouched deliveries
    }

    // This delivery is eligible for HVI evaluation
    eligibleCount++;

    // Precedence rule:
    // 1. Any simulated link click -> 100 points (click takes precedence over report)
    // 2. Otherwise any report -> 0 points
    // 3. Otherwise opened only -> 25 points
    // 4. Otherwise expired without interaction -> 0 points
    if (delivery.hasClick) {
      clickedCount++;
      totalRiskPoints += 100;
    } else if (delivery.hasReport) {
      reportedCount++;
      totalRiskPoints += 0;
    } else if (delivery.hasOpen) {
      openedOnlyCount++;
      totalRiskPoints += 25;
    } else {
      // Expired without interaction
      expiredUntouchedCount++;
      totalRiskPoints += 0;
    }
  }

  const hvi = eligibleCount > 0 ? Math.round(totalRiskPoints / eligibleCount) : null;
  const hviLabel = hvi !== null ? `${hvi}` : 'Insufficient data';

  const responseCoverage =
    launchedCount > 0 ? Math.round((interactionCount / launchedCount) * 100) : null;

  const clickRate =
    eligibleCount > 0 ? Math.round((clickedCount / eligibleCount) * 100) : null;

  const reportRate =
    eligibleCount > 0 ? Math.round((reportedCount / eligibleCount) * 100) : null;

  const trainingCompletionRate =
    trainingStats.totalAssignments > 0
      ? Math.round((trainingStats.completedAssignments / trainingStats.totalAssignments) * 100)
      : null;

  return {
    hvi,
    hviLabel,
    eligibleCount,
    launchedCount,
    interactionCount,
    clickedCount,
    reportedCount,
    openedOnlyCount,
    expiredUntouchedCount,
    pendingUntouchedCount,
    responseCoverage,
    clickRate,
    reportRate,
    trainingCompletedCount: trainingStats.completedAssignments,
    trainingTotalCount: trainingStats.totalAssignments,
    trainingCompletionRate,
  };
}
