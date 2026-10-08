export type UserRole = 'officer' | 'employee';

export interface UserProfile {
  user_id: string;
  organization_id: string;
  role: UserRole;
  email?: string;
}

export interface EmployeeRecord {
  id: string;
  user_id: string;
  department_id: string;
  display_name: string;
  job_role: string;
  department?: {
    id: string;
    name: string;
  };
}

export type CampaignStatus = 'draft' | 'launched';
export type CampaignDifficulty = 'introductory' | 'intermediate' | 'advanced';

export interface CampaignVariant {
  job_role: string;
  department_name: string;
  subject: string;
  body: string;
  adaptation_reason: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  created_by: string | null;
  title: string;
  scenario: string;
  target_department_id: string | null;
  default_difficulty: CampaignDifficulty;
  status: CampaignStatus;
  response_deadline: string;
  generation_mode: string;
  variants: CampaignVariant[];
  created_at: string;
  launched_at: string | null;
}

export interface Delivery {
  id: string;
  campaign_id: string;
  employee_id: string;
  subject: string;
  body: string;
  difficulty: CampaignDifficulty;
  adaptation_reason: string | null;
  created_at: string;
  campaign?: {
    title: string;
    scenario: string;
    status: CampaignStatus;
    response_deadline: string;
  };
  events?: EngagementEvent[];
}

export type EngagementType = 'opened' | 'clicked' | 'reported';

export interface EngagementEvent {
  id: string;
  delivery_id: string;
  type: EngagementType;
  occurred_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  explanation: string;
}

export interface TrainingModule {
  id: string;
  scenario: string;
  title: string;
  lesson: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface TrainingAssignment {
  id: string;
  delivery_id: string;
  module_id: string;
  status: 'assigned' | 'completed';
  assigned_at: string;
  completed_at: string | null;
  module?: TrainingModule;
  delivery?: Delivery;
}

export interface TrainingAttempt {
  id: string;
  assignment_id: string;
  request_id: string;
  submitted_answers: Record<string, number>;
  score: number;
  passed: boolean;
  created_at: string;
}

export interface HviMetrics {
  hvi: number | null; // null if insufficient data
  hviLabel: string;
  eligibleCount: number;
  launchedCount: number;
  interactionCount: number;
  clickedCount: number;
  reportedCount: number;
  openedOnlyCount: number;
  expiredUntouchedCount: number;
  pendingUntouchedCount: number;
  responseCoverage: number | null; // percentage
  clickRate: number | null; // percentage
  reportRate: number | null; // percentage
  trainingCompletedCount: number;
  trainingTotalCount: number;
  trainingCompletionRate: number | null; // percentage
}
