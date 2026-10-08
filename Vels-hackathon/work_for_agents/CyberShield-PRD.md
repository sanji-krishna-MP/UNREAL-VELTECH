# CyberShield — Product Requirements Document

Version: competition MVP, 8 October 2026
Build time: 180 minutes | Coding assistant: Antigravity | Required hosting: Vercel

## 1. Product objective

Build an adaptive enterprise cyber-defense simulator where a security officer creates role-specific mock spear-phishing campaigns, synthetic employees interact safely, the organization sees an explainable human vulnerability index, and failed simulations immediately assign interactive micro-training.

Success is one reliable, deployed, database-backed campaign-to-training journey. This PRD proposes implementation choices; it does not add organizer rules. The supplied judging criteria reward completeness (30), AI use and authentic telemetry (25), security/data integrity (20), technical comprehension (15), and UI/UX (10).

## 2. Non-negotiable constraints

- Software only; no hardware, sensors, or IoT.
- Frontend changes persist in a live hosted database and survive refresh and new sessions.
- Deploy the actual full-stack application to a public Vercel URL.
- No credentials or API keys in browser bundles. For this project, even the Supabase publishable key stays on the server to satisfy the literal constraint.
- Every important decision must be explainable in technical Q&A.
- Preserve authentic AI prompts/tool logs using the organizer-required method. Never fabricate evidence.

## 3. Fixed technology stack

| Layer | Selected technology | Purpose |
|---|---|---|
| Framework | Next.js App Router + TypeScript | One project for UI, server rendering, and backend endpoints |
| UI | React + Tailwind CSS + shadcn/ui + Lucide icons | Fast, consistent, responsive interface |
| Backend | Next.js Route Handlers, Node.js runtime | Authentication, validation, campaign generation, event recording, scores |
| Live database | Supabase hosted PostgreSQL | Persistent relational data, constraints, transactions |
| Authentication | Supabase Auth, server-mediated cookie sessions | Officer and employee sign-in |
| Data access | @supabase/supabase-js + @supabase/ssr, server-only modules | Session-scoped queries without a separate ORM |
| Validation | Zod | Validate requests and generated campaign objects |
| AI generation | Google Gemini API using @google/genai, server-side | Role-specific mock campaign copy; model selected by GEMINI_MODEL |
| Charts | Simple CSS/SVG bars and metric cards | Explain results without an extra chart dependency |
| Hosting | Vercel | Next.js application and server endpoints |
| Repository | GitHub + npm lockfile | Reviewable code, reproducible dependencies, deployment integration |
| Verification | Vitest for scoring/adaptation; browser workflow checks | Validate important business logic and public deployment |

Use current mutually compatible stable package versions at project creation and commit the lockfile. Do not add Express, a separate API service, Redis, queues, a vector database, or an ORM for this MVP. Confirm the available Gemini model in the configured account; do not guess a model identifier. AI generation is an enhancement over a working template engine, never a dependency of the core workflow.

## 4. Scope and roles

MVP is one synthetic demonstration organization with two departments: Payroll and Engineering. Seed one officer and at least two authenticated employees, one per department. Additional synthetic employee records may be included for targeting. Seed actual account credentials privately through environment configuration, never source code. Give judges demo access through the approved submission channel.

Officer: view organization results, generate/edit/launch campaigns, inspect delivery results and training progress.

Employee: view only their own simulation deliveries, record their own interactions, and complete their own assigned training.

Exclude real email delivery, credential capture, employee imports, attachments, enterprise SSO, multi-tenant administration, notifications, and elaborate settings. The controlled inbox is the campaign delivery mechanism. If organizers explicitly require actual email delivery, revise scope before implementing it.

## 5. Application screens

| Route | Role | Required content/actions |
|---|---|---|
| /login | Public | Sign in, validation and error state; no public officer registration |
| /dashboard | Officer | Index, response coverage, click/report rates, training completion, department breakdown, recent campaigns |
| /campaigns/new | Officer | Department, job role, scenario, difficulty, expiry; generate, preview, edit, save draft, launch |
| /campaigns/[id] | Officer | Campaign status, message variants, recipient outcomes, training status |
| /inbox | Employee | Own deliveries, unread state, pending training |
| /inbox/[deliveryId] | Employee owner | Safe message preview, report action, controlled simulated link |
| /training/[assignmentId] | Employee owner | Lesson, three-question quiz, feedback, retry, completion |

Use a restrained navy/slate security-console design with teal accents, readable contrast, clear status labels, and responsive cards/tables. Include skeleton/loading, empty, success, and actionable error states. Never fill production widgets with hardcoded analytics. Avoid spending time on a marketing landing page.

## 6. Complete user flow

### A. Officer creates a campaign

1. Officer signs in; server verifies the session and stored role.
2. Dashboard loads persisted aggregate results. With no evaluated deliveries, show “Insufficient data”.
3. Officer selects Payroll or Engineering, a job role, scenario, difficulty, and response-window end.
4. Server retrieves relevant previous outcomes and training state for the target cohort.
5. Generator produces role-specific message variants. Payroll examples concern a mock payroll detail change; Engineering examples concern a mock repository-access review. Use fictional entities only.
6. Preview shows subject, body, role context, generation mode, and adaptation explanation. Officer may edit.
7. Saving creates a persisted draft. Reloading restores the draft.
8. Launch validates recipients and content and creates deliveries in one transaction. Freeze the launched content; edits require a new draft.
9. A successful launch returns the campaign page. A retry returns the existing launch result and does not duplicate deliveries.

### B. Employee interacts safely

1. Employee signs in independently and sees their own persisted deliveries.
2. Opening a message records an open event. Repeated rendering does not create duplicate open records.
3. Reporting records a report event and gives constructive feedback.
4. The simulated link is an application-controlled button. Its explicit POST records a click; GET requests and link previews must not count as clicks.
5. The same database transaction records the failure and creates the relevant training assignment. If it fails, both changes roll back and the UI offers retry.
6. The employee immediately sees “This was a simulation” plus the assigned lesson link. No password or payment form ever appears.
7. The officer sees updated results on the next dashboard refresh. Polling every 10–15 seconds is optional; WebSockets are unnecessary.

### C. Employee completes micro-training

1. Assignment opens a short lesson about the failed scenario and three multiple-choice questions.
2. Server checks assignment ownership and validates answers against server-held answer keys.
3. All three must be correct to complete. Otherwise provide explanations and allow a retry.
4. Persist each attempt and mark completion on success. Repeating a successful request does not create multiple completions.
5. Dashboard updates the completion rate. Historical simulation failure remains recorded.

### D. Platform adapts the next campaign

Use simple, auditable rules per recipient:
- No previous failure: selected scenario and introductory difficulty.
- Latest failure with unfinished assigned training: same topic, introductory difficulty.
- Latest failure with completed training: same topic, intermediate difficulty.

The campaign builder proposes these defaults. Officer can override difficulty; record the override and explanation. Show a recommendation reason, for example: “Repository-link scenario recommended because the previous simulation was clicked; introductory difficulty retained because training is pending.” This is transparent rule-based adaptation, not a claim of machine learning.

## 7. Human vulnerability index

A delivery is one employee’s participation in one launched campaign. Filter analytics to the selected campaign/date range, defaulting to all launched campaigns.

Eligible deliveries have at least one interaction OR have passed the campaign response deadline. Exclude unexpired deliveries with no interaction. Evaluate deadlines at query time; no scheduled background job is required.

| Highest-priority outcome | Risk points |
|---|---:|
| Any simulated link click | 100 |
| Otherwise any report | 0 |
| Otherwise opened only | 25 |
| Otherwise expired without interaction | 0 |

HVI = round(sum of eligible delivery risk points / eligible delivery count).

Example: one click, one report, one open-only delivery = round(125 / 3) = 42.

If denominator is zero, show “Insufficient data”, not 0. Click takes precedence over report regardless of order. Completing training never changes historical risk. Compute organization and department results from underlying delivery records, not an average of department averages.

This is an MVP heuristic, not a validated security assessment. No interaction does not demonstrate awareness, so always display coverage alongside HVI:
- Response coverage = deliveries with any interaction / launched deliveries.
- Click rate = deliveries with a click / eligible deliveries.
- Report rate = deliveries with a report / eligible deliveries.
- Training completion = completed assignments / all assignments.
- Use “—” for zero-denominator metrics; show counts alongside percentages.

Use “0–100 vulnerability score; higher means greater observed risk”. Avoid unsupported low/medium/high thresholds. Label any seeded historical results as demo data.

## 8. Live database model

Use UUID identifiers, UTC timestamps, foreign keys, and indexes on ownership and campaign relationships.

| Table | Essential fields |
|---|---|
| organizations | id, name |
| departments | id, organization_id, name |
| profiles | user_id linked to auth.users, organization_id, role: officer/employee |
| employees | id, user_id unique, department_id, display_name, job_role |
| campaigns | id, organization_id, created_by, title, scenario, default_difficulty, status: draft/launched, response_deadline, generation_mode, created_at, launched_at |
| deliveries | id, campaign_id, employee_id, subject, body, difficulty, adaptation_reason, created_at; unique(campaign_id, employee_id) |
| engagement_events | id, delivery_id, type: opened/clicked/reported, occurred_at; unique(delivery_id, type) |
| training_modules | id, scenario unique, title, lesson, questions |
| training_answer_keys | module_id, correct_answers; server/database-only access |
| training_assignments | id, delivery_id, module_id, status: assigned/completed, assigned_at, completed_at; unique(delivery_id, module_id) |
| training_attempts | id, assignment_id, request_id unique, submitted_answers, score, created_at |
| generation_runs | id, campaign_id nullable, actor_id, mode, model nullable, prompt_version, duration_ms, outcome, created_at |

Keep draft message variants in a campaigns JSONB field or separate campaign_variants table; choose one and document it. On launch, copy finalized variants into deliveries as immutable snapshots. Seed a module and server-held answer key for each supported scenario.

Use SQL functions/RPC transactions for launch and click-plus-assignment. Functions must validate auth.uid(), officer role or employee ownership, organization membership, and permitted state transitions. Restrict execution privileges; if SECURITY DEFINER is needed, set a safe search_path and perform explicit authorization inside it.

## 9. Backend contracts and security

Suggested endpoints:
- POST /api/auth/login and /api/auth/logout.
- POST /api/campaigns/generate: officer only; structured validated generation.
- POST /api/campaigns: persist draft; officer only.
- PATCH /api/campaigns/[id]: edit owned-organization draft only.
- POST /api/campaigns/[id]/launch: transactional and idempotent.
- POST /api/deliveries/[id]/events: employee owner only; enum event type.
- POST /api/training/[id]/attempts: employee owner only; grade on server.
- GET /api/dashboard: officer-only persisted aggregates.

For every mutation, verify session, authorization, Zod input schema, and same-origin request protection. Derive employee identity from the session, never from trusted client role/user fields. Enable RLS on exposed database tables and enforce organization/owner policies. Deny client edits to roles, event history, scores, and completion status. Keep quiz answer keys inaccessible to employees.

All Supabase and Gemini SDK clients live in server-only modules. Use session-scoped Supabase access for routine queries so RLS remains active. Privileged service keys are for a local setup/seed script only; never needed in the browser and preferably absent from deployed runtime.

Server-mediated login uses secure, HttpOnly, SameSite cookies and supported session refresh handling. Do not cache private pages or API responses across users. Never return tokens or keys in JSON. Render campaign body as plain text; do not inject AI-generated HTML. Map the mock CTA to the controlled internal action, ignoring model-generated URLs.

Validate generation output length and shape. Use one generation request for a small batch of role variants, a bounded timeout, an officer generation quota enforced using persisted records, and a labeled template fallback. Never log secrets, real employee personal information, or raw authentication payloads.

## 10. AI generation requirements

Use a server-side prompt with fictional department/role, scenario, difficulty, and the adaptation reason. Request structured JSON containing subject and plain-text body only. Do not request credential harvesting, external links, attachments, or real-person impersonation. Validate before storing or displaying.

If GEMINI_API_KEY is absent, the provider times out, or validation fails, return a deterministic role-specific template and label it “Template mode”. If provider output succeeds, label it “AI-generated; reviewed by officer”. Never claim that templates were generated by AI.

Persist generation mode, prompt version, configured model, duration, and success/fallback outcome. Product generation logs and coding-assistant telemetry are distinct: preserve both honestly where applicable.

## 11. Environment configuration

Create .env.example with placeholders:

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
APP_URL=http://localhost:3000

Keep all values server-side; do not use NEXT_PUBLIC_ for keys. Put local values in ignored .env.local. Setup-only credentials such as SUPABASE_SECRET_KEY and demo passwords belong in the local seed environment, not committed files. Use the key type supported by the configured Supabase project and document it.

## 12. Vercel deployment runbook

1. Create a Supabase project. Apply SQL migrations, RLS policies, transactional functions, and seed modules/accounts using private setup credentials.
2. Run the app locally with .env.local and prove one database write survives refresh.
3. Push code, migrations, README, .env.example, and lockfile to GitHub. Exclude secrets and generated build output.
4. Import the repository into Vercel and use its Next.js framework preset. Keep standard build settings and a Node.js version supported by the selected dependencies. Do not use static export: this app requires server endpoints.
5. Add server environment variables in Vercel project settings for the intended deployment environment. Set APP_URL to the final HTTPS application URL. Configure any Supabase auth site/redirect URLs actually used by the login flow.
6. Deploy. When environment values change, redeploy so the deployment receives them.
7. Verify that judges can open the production URL without a Vercel team/deployment access prompt. Application authentication should still work.
8. Test officer and employee workflows using separate browser sessions on the public URL. Check the corresponding live database records.
9. Inspect deployment errors without exposing secrets. Fix, redeploy, and rerun only affected checks.
10. Submit production Vercel URL, GitHub repository, demo access through the approved channel, README, and required genuine AI logs.

Deploy a basic connected shell by minute 30. Do not wait until the end to discover deployment or database problems. Vercel hosts the app; Supabase hosts the live PostgreSQL database. Never store business data in the deployment filesystem or process memory.

## 13. Acceptance tests

- Officer creates a Payroll draft, reloads, and sees the same saved content.
- Launch creates exactly one delivery per target employee; retry does not duplicate it.
- Payroll and Engineering messages contain materially different job-specific context.
- Employee A cannot fetch or mutate employee B’s delivery or training by guessing IDs.
- Employee cannot call officer generation, launch, or dashboard endpoints.
- Opening and reporting persist and appear in officer analytics.
- Clicking creates a persisted event and immediate assignment atomically; retry creates no duplicate.
- Incorrect training answers give feedback; correct answers persist completion after refresh.
- Three eligible outcomes of click/report/open produce HVI 42.
- Unexpired untouched deliveries are excluded; no eligible results show Insufficient data.
- A report after a click does not erase failure; training does not lower historical HVI.
- Completing training changes the next recommendation and displays its reason.
- Missing AI key triggers a visibly labeled template fallback, not a broken workflow.
- Browser JavaScript bundles and responses contain no API keys or credentials.
- Core screens work on mobile and desktop; the final Vercel URL passes the complete journey.

## 14. Three-hour implementation schedule

| Minutes | Deliverable |
|---|---|
| 0–15 | Confirm accounts/access; scaffold; migration and screen plan |
| 15–30 | Connect Supabase, configure auth, deploy initial shell to Vercel |
| 30–65 | Persisted draft, role templates, launch and employee inbox |
| 65–100 | Engagement transactions, automatic assignment, quiz completion |
| 100–120 | HVI, dashboard, adaptation explanations |
| 120–135 | Gemini generation and reliable labeled fallback |
| 135–155 | Authorization/integrity checks and responsive UI polish |
| 155–175 | Public deployment verification, README, genuine log export, demo rehearsal |
| 175–180 | Submit and verify links |

If behind, cut decorative animation, chart sophistication, and AI-provider integration before cutting live persistence, authorization, required simulation flows, training, or deployment. Template generation must still be personalized and adaptive. Describe any missing AI integration honestly.

## 15. Judge demonstration and explanation

Three-minute demo:
1. Show officer dashboard and explain live data.
2. Generate and launch a Payroll simulation; point out role context.
3. Switch to an authenticated employee session; click the controlled mock link.
4. Show immediate training assignment, complete the quiz, and refresh.
5. Return to officer dashboard: show persisted outcome, coverage, HVI formula, and training completion.
6. Preview an adapted follow-up recommendation and explain why its difficulty changed.

Be ready to explain: browser → Vercel server → Supabase architecture; server-only credentials; session and RLS checks; atomic failure/training writes; score formula and limitations; rule-based adaptation; template fallback; and the actual AI-assisted development process.

## 16. Implementation instruction for Antigravity

Treat this PRD as the implementation source of truth. Begin with a short acceptance checklist and implement in milestone order. Keep code modular and readable. Explain each milestone in plain language and record actual verification results. Do not claim deployment, persistence, AI generation, security checks, or tests succeeded without evidence. Report missing account configuration promptly while continuing independent implementation. Do not add optional features until the required deployed workflow passes.

## 17. Official implementation references

- Supabase Next.js quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Supabase server-side auth: https://supabase.com/docs/guides/auth/server-side
- Supabase SSR client/session handling: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Next.js environment variables: https://nextjs.org/docs/pages/guides/environment-variables
- Vercel environment setup: https://examples.vercel.com/kb/guide/how-to-add-vercel-environment-variables

These references support framework setup, session handling, and environment configuration. Scoring, scope, and architecture decisions above are proposed specifically for this competition MVP.
