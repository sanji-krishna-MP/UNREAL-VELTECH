# CyberShield — Enterprise Cyber-Defense Simulation OS

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ecf8e?logo=supabase)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-Passed_100%25-green?logo=vitest)](https://vitest.dev)

CyberShield is an adaptive enterprise cyber-defense simulator where security officers create role-specific mock spear-phishing campaigns, synthetic employees interact safely in a controlled internal inbox, the organization sees a mathematically explainable Human Vulnerability Index (HVI), and failed simulations immediately assign interactive micro-training.

---

## 🎯 First-MVP Success Journey (Complete)

1. **Campaign Creation & Launch**:
   - Security Officer signs in and configures a simulation targeted at **Payroll** (Direct deposit redirection) or **Engineering** (Mock SSH/Repo access review).
   - Generates role-specific message content with clearly labeled **"Template mode"** (or AI-generated if Gemini API key provided).
   - The system displays rule-based cohort adaptation rationale.
   - Launch freezes the content and creates persistent deliveries for targeted employees without duplicate entries.
2. **Safe Employee Interaction**:
   - Employees sign in and access **only their own** deliveries in an internal inbox.
   - Opening a message safely displays the plain-text copy and records an open event.
   - Reporting records a threat report event (0 risk points).
   - Clicking the simulated link records a failure (100 risk points) and **atomically assigns the relevant micro-training**.
3. **Immediate Micro-Training**:
   - The employee immediately sees a "This was an authorized simulation" banner with a direct link to their assigned lesson.
   - The lesson features concise defensive guidance and 3 interactive multiple-choice questions.
   - Answer keys are held strictly on the server and are inaccessible to clients.
   - Score of 3/3 marks verified completion; retries with explanations are permitted.
   - Completion persists to the live database and survives refresh.
4. **Officer Telemetry & HVI Calculation**:
   - Officer console computes live Human Vulnerability Index (HVI) matching the PRD formula:
     - Clicked: 100 risk points
     - Otherwise reported: 0 risk points
     - Otherwise opened only: 25 risk points
     - Otherwise expired without interaction: 0 risk points
     - Excludes unexpired untouched deliveries
     - Verified test: 1 click (100) + 1 report (0) + 1 open (25) = `round(125 / 3) = 42`.
5. **Rule-Based Follow-Up Adaptation**:
   - Proposes introductory baseline for cohorts with no failures.
   - Retains introductory difficulty if previous simulation was clicked and training is pending.
   - Advances to intermediate difficulty once micro-training is verified complete.

---

## 🔐 Security & Architecture Highlights

- **Server-Only Credentials**: Zero API keys or service tokens are leaked in client bundles or API JSON responses.
- **Server-Enforced Access**: Every read and mutation verifies session identity and stored database role.
- **Strict Row Level Security (RLS)**: Employees cannot read each other's deliveries or access officer-only management routes.
- **Hidden Answer Keys**: Quiz answers are stored in `training_answer_keys` with RLS denying client queries. All grading executes server-side.
- **Controlled Links**: Simulated links are internal button mutations (`POST /api/deliveries/[id]/events`), eliminating external phishing risks or GET-preview false triggers.

---

## 👥 Demo Accounts (Pre-Seeded)

| Role | Email | Password | Department & Position |
|---|---|---|---|
| **Security Officer** | `officer@cybershield.internal` | `CyberShield2026!` | Office of the CSO (Director) |
| **Payroll Employee** | `payroll.alex@cybershield.internal` | `CyberShield2026!` | Payroll (Payroll Specialist) |
| **Engineering Employee** | `eng.devon@cybershield.internal` | `CyberShield2026!` | Engineering (Senior Staff Engineer) |

*The `/login` screen includes convenient 1-click credential filler buttons for rapid evaluation.*

---

## 🚀 Supabase Setup (1-Click SQL)

1. Open your Supabase Project: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql/new`
2. Open [`supabase/COMPLETE_CYBERSHIELD_SETUP.sql`](supabase/COMPLETE_CYBERSHIELD_SETUP.sql), copy its entire contents, paste into the SQL Editor, and click **RUN**.
3. All tables, RLS policies, modules, answer keys, and the 3 demo users will be initialized immediately!

---

## 🌐 Environment Configuration (`.env.local` / Vercel)

Create `.env.local` based on `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
APP_URL=http://localhost:3000
```

---

## 🧪 Automated Verification Suite

Run the Vitest test suite to verify scoring mathematics and adaptation rules:

```bash
npm test
```

Results:
- `src/lib/scoring.test.ts`: Verified exact HVI calculation (including HVI = 42 benchmark, precedence rules, and excluded unexpired deliveries).
- `src/lib/adaptation.test.ts`: Verified rule-based recommendation transitions.
