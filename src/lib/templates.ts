import { CampaignDifficulty, CampaignVariant } from './types';

export interface TemplateParams {
  department: 'Payroll' | 'Engineering' | string;
  scenario: string;
  difficulty: CampaignDifficulty;
  adaptationReason?: string;
}

export function generateRoleTemplate(params: TemplateParams): CampaignVariant {
  const isPayroll = params.department.toLowerCase().includes('payroll');

  if (isPayroll) {
    if (params.difficulty === 'intermediate') {
      return {
        department_name: 'Payroll',
        job_role: 'Payroll Specialist',
        subject: '[Action Required] Automated Audit: Unconfirmed Routing Number Discrepancy',
        body: `Dear Payroll Team Member,

During our scheduled end-of-quarter automated compliance audit, the enterprise disbursement system detected an unconfirmed routing transit number discrepancy on your upcoming payroll disbursement file.

Federal banking regulations mandate immediate electronic identity confirmation before batch ACH processing closes at 17:00 EST. Failure to authenticate may postpone scheduled compensation transfers.

Please use the secure link below to review your automated clearance record and verify ledger consistency.`,
        adaptation_reason:
          params.adaptationReason ||
          'Adaptive escalation: Intermediate payroll banking simulation following completed micro-training.',
      };
    }

    if (params.difficulty === 'advanced') {
      return {
        department_name: 'Payroll',
        job_role: 'Payroll Specialist',
        subject: 'Confidential: Executive Wire Protocol Clearance Notice - Q3 Batch #8402',
        body: `Attention Payroll Operations,

The Office of the Chief Financial Officer has flagged an urgent ledger variance within executive payroll allocation batch #8402. In accordance with SOX 404 security protocols, all payroll processors assigned to this distribution cycle must validate dual-authorization keys before releasing bank transmits.

Access the protected clearance ledger below to verify your session token.`,
        adaptation_reason:
          params.adaptationReason ||
          'Advanced multi-tier payroll diversion simulation simulating executive urgency.',
      };
    }

    // Default: introductory
    return {
      department_name: 'Payroll',
      job_role: 'Payroll Specialist',
      subject: 'URGENT: Verify Updated Direct Deposit Account Details',
      body: `Hello Payroll Team Member,

A request was recently received to modify your primary direct deposit banking routing number for upcoming payroll distribution.

If you initiated this change, no further action is necessary. However, if you did NOT authorize this modification, your account may be compromised. You must verify your employee identity immediately to prevent erroneous payroll deposit redirection.

Please click the secure button below to confirm your direct deposit details immediately.`,
      adaptation_reason:
        params.adaptationReason ||
        'Introductory baseline simulation: High-urgency direct deposit redirection hook.',
    };
  } else {
    // Engineering
    if (params.difficulty === 'intermediate') {
      return {
        department_name: 'Engineering',
        job_role: 'Senior Staff Engineer',
        subject: '[CRITICAL ALERT] CI/CD Pipeline Secret Exposure in Repository Pull Request #1492',
        body: `Hi Engineering Team,

Our automated GitGuardian security scanner detected a potential high-entropy production API token committed to private repository 'core-infra-service' in PR #1492.

As the designated CODEOWNER for this subsystem, your emergency sign-off is required to quarantine the branch and revoke compromised deployment credentials.

Click the button below to review the tainted commit diff and authorize the credential rotation protocol.`,
        adaptation_reason:
          params.adaptationReason ||
          'Adaptive escalation: Intermediate engineering CI/CD token alert following completed micro-training.',
      };
    }

    if (params.difficulty === 'advanced') {
      return {
        department_name: 'Engineering',
        job_role: 'Senior Staff Engineer',
        subject: 'URGENT: GitHub Enterprise OAuth Application Authorization Expiring - Action Required',
        body: `Staff Developer,

Your corporate GitHub Enterprise SSO token for kubernetes-cluster-orchestrator has failed automated mutual-TLS verification. Active deploy privileges will be suspended in 60 minutes unless your developer cryptographic profile is re-signed with the corporate root CA.

Click the link below to perform zero-trust device re-authentication.`,
        adaptation_reason:
          params.adaptationReason ||
          'Advanced developer credential harvesting simulation targeting internal pipeline authorization.',
      };
    }

    // Default: introductory
    return {
      department_name: 'Engineering',
      job_role: 'Senior Staff Engineer',
      subject: 'ACTION REQUIRED: Security Audit - Verify Engineering SSH Key & Repo Permissions',
      body: `Hello Devon Vance,

Our automated security scanner detected an unverified SSH public key authorization request associated with your internal repository permissions.

To prevent repository commit and deployment revocation under our zero-trust engineering access policy, please review your registered developer credentials within the next 24 hours.

Click the button below to verify your repository access.`,
      adaptation_reason:
        params.adaptationReason ||
        'Introductory baseline simulation: Standard engineering repository access review trigger.',
    };
  }
}
