import { CampaignDifficulty } from './types';

export interface RecipientHistory {
  hasClickedPrevious: boolean;
  previousScenario?: string;
  hasCompletedTraining?: boolean;
}

export interface AdaptationResult {
  suggestedScenario: string;
  suggestedDifficulty: CampaignDifficulty;
  explanation: string;
}

/**
 * Deterministic, rule-based recommendation per PRD Section 6 D:
 * - No previous failure: selected/default scenario and introductory difficulty.
 * - Latest failure with unfinished assigned training: same topic, introductory difficulty.
 * - Latest failure with completed training: same topic, intermediate difficulty.
 */
export function getAdaptedRecommendation(
  defaultScenario: string,
  history?: RecipientHistory
): AdaptationResult {
  if (!history || !history.hasClickedPrevious) {
    return {
      suggestedScenario: defaultScenario,
      suggestedDifficulty: 'introductory',
      explanation: 'Introductory baseline recommended: no previous simulation failures recorded for this employee cohort.',
    };
  }

  const scenario = history.previousScenario || defaultScenario;

  if (history.hasCompletedTraining) {
    return {
      suggestedScenario: scenario,
      suggestedDifficulty: 'intermediate',
      explanation: `Intermediate difficulty recommended for ${scenario}: previous failure was addressed with verified micro-training completion.`,
    };
  } else {
    return {
      suggestedScenario: scenario,
      suggestedDifficulty: 'introductory',
      explanation: `Introductory difficulty retained for ${scenario}: previous simulation was clicked and assigned training remains pending.`,
    };
  }
}
