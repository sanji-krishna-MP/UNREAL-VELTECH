# CyberShield — Enterprise Cyber-Defense Simulation OS

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ecf8e?logo=supabase)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-Passed_100%25-green?logo=vitest)](https://vitest.dev)

CyberShield is an enterprise-grade adaptive cyber-defense simulator where security officers design and launch department-specific mock spear-phishing campaigns, employees safely interact in a controlled simulation environment, organizations track an explainable **Human Vulnerability Index (HVI)**, and failed simulations immediately trigger role-targeted interactive micro-training.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client Web Interface     │
                                  │  (Next.js App Router / React) │
                                  └───────────────┬───────────────┘
                                                  │ HTTPS
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │       Next.js API Routes      │
                                  │   (Server-Only Auth & Role)   │
                                  └───────┬───────────────┬───────┘
                                          │               │
                 Supabase Client (User JWT)               │ Service Role (Privileged)
                                          ▼               ▼
                 ┌────────────────────────────────────────────────┐
                 │          Supabase PostgreSQL Database          │
                 │  - Row Level Security (RLS) on all 10 tables   │
                 │  - Non-recursive profiles security model       │
                 │  - SECURITY DEFINER RPCs with caller identity  │
                 │  - Hidden quiz keys inaccessible to clients    │
                 └────────────────────────────────────────────────┘
```

### Core Data Models
- **`organizations` & `departments`**: Multi-tenant structure separating cohorts (e.g., Payroll, Engineering).
- **`profiles` & `employees`**: User profiles with strict RBAC (`officer` vs `employee`).
- **`campaigns` & `deliveries`**: Campaign states (`draft`, `launched`, `completed`) with immutable personalized deliveries.
- **`engagement_events`**: Audit trail of employee interactions (`opened`, `clicked`, `reported`).
- **`training_modules` & `training_assignments`**: Interactive learning modules assigned atomically upon simulation clicks.
- **`training_answer_keys` & `training_attempts`**: Server-only grading tables with hidden answer keys.
- **`human_vulnerability_index`**: Department-level and company-wide vulnerability analytics.

---

## 🔄 End-to-End Demo Flow

1. **Officer Login & Campaign Configuration**:
   - The Security Officer logs in at `/login` and accesses the Officer Console (`/dashboard`).
   - The officer selects a target department (**Payroll** or **Engineering**) and chooses a threat scenario (e.g., direct deposit redirection, mock SSH/repository access review).
   - Generates tailored simulation templates with role adaptation rationale.
2. **Campaign Launch**:
   - Launching invokes `rpc_launch_campaign`, freezing the content and generating delivery records for all target employees atomically.
3. **Employee Interaction**:
   - Employees sign in and view **only their own** deliveries in the simulation inbox (`/inbox`).
   - **Report Threat**: Safe action. Records a threat report with `0` risk points.
   - **Click Simulated Link**: Records a click event (`100` risk points) and invokes `rpc_record_click_and_assign`, immediately assigning targeted micro-training.
4. **Immediate Micro-Training**:
   - The employee receives an immediate awareness prompt and completes the 3-question interactive lesson (`/training`).
   - Answers are submitted to `/api/training/verify`, where scoring runs against server-stored answer keys.
   - Upon scoring 3/3, completion is persisted to the database.
5. **Analytics & Human Vulnerability Index**:
   - The Officer Console dynamically updates with departmental breakdown charts, aggregate trend analysis, and live HVI metrics.

---

## 📊 Human Vulnerability Index (HVI) Scoring Formula

The HVI is calculated using deterministic, PRD-compliant risk points for every scored delivery:

| Interaction Event | Risk Points | Precedence Rule |
|---|:---:|---|
| **Clicked link** | **100** | Highest precedence — counts as compromised. |
| **Reported threat** | **0** | Precedes open — counts as vigilant defense. |
| **Opened email only** | **25** | Moderate risk — engaged without reporting or clicking. |
| **Expired without interaction** | **0** | Timed out without interaction. |
| **Active & untouched** | *Excluded* | Not yet interacted; excluded from the calculation denominator. |

### Mathematical Formula:
$$\text{HVI} = \text{round}\left(\frac{\sum \text{Risk Points of Scored Deliveries}}{\text{Total Scored Deliveries}}\right)$$

*Example Benchmark*: In a cohort with 1 click (`100`), 1 report (`0`), and 1 open (`25`), total points = 125, scored deliveries = 3:
$$\text{HVI} = \text{round}\left(\frac{125}{3}\right) = 42$$

All calculations are tested and verified in `src/lib/scoring.test.ts`.

---

## 🔒 Security Model & Best Practices

- **Zero Client Token Leaks**: `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side code (`src/lib/supabase-admin.ts`, API routes, and setup scripts). Never exposed via client bundles or `NEXT_PUBLIC_*` prefixes.
- **Non-Recursive RLS Policies**: Table policies on `profiles` evaluate `user_id = auth.uid()` directly without subqueries into `profiles`, preventing circular recursion recursion errors.
- **Identity-Checked SECURITY DEFINER RPCs**:
  - `rpc_launch_campaign` verifies `auth.uid() = p_user_id` and checks the officer role.
  - `rpc_record_click_and_assign` verifies `auth.uid() = p_user_id` and ensures the delivery belongs to the calling employee.
- **Server-Graded Quizzes**: Answer keys are stored in `training_answer_keys` with RLS denying client queries. Answers are evaluated entirely on the server.
- **Role-Based API Protection**: All endpoints under `/api/campaigns` and `/api/officer` enforce `officer` role checks from verified session tokens.
- **Credentials & Secret Hygiene**:
  - Plain-text passwords and secrets are excluded from Git repository tracking (`.gitignore`).
  - The login interface pre-fills only corporate email identifiers for quick navigation; passwords are kept private and entered securely.

---

## 👥 Demo Accounts & Access

For evaluation and competition judging, demo accounts are configured for the following roles:

| Role | Account Email | Department |
|---|---|---|
| **Security Officer** | `officer@cybershield.internal` | Office of the CSO |
| **Payroll Employee** | `payroll.alex@cybershield.internal` | Payroll |
| **Engineering Employee** | `eng.devon@cybershield.internal` | Engineering |

> 🔑 **Judge / Evaluation Access**: Demo account credentials are provided directly through the competition's private communication channel. To set or rotate credentials locally or in your own Supabase project, refer to the Database Setup section below.

---

## 🗄️ Database Setup & Reproducibility

### Option 1: Supabase SQL Editor (Recommended)
1. Open your Supabase Dashboard &rarr; **SQL Editor**.
2. Run [`supabase/COMPLETE_CYBERSHIELD_SETUP.sql`](supabase/COMPLETE_CYBERSHIELD_SETUP.sql).
3. The script creates all 10 tables, sets up non-recursive RLS policies, compiles atomic RPCs, and seeds baseline training modules without deleting existing campaign records.

### Option 2: Account Seeding & Password Rotation
To seed demo accounts or rotate passwords securely:
```bash
# Set your target environment variables in .env.local
node scripts/seed-users.mjs
```
The script accepts `DEMO_OFFICER_PASSWORD` and `DEMO_EMPLOYEE_PASSWORD` environment variables, or generates random cryptographic passwords printed only to the local console.

### Option 3: Automated Database Verification
Validate that your live Supabase database passes all 8 operational checks:
```bash
node scripts/verify-live-flow.mjs
```

---

## 🚀 Vercel Deployment Guide

CyberShield is configured for automated deployment from GitHub to Vercel with Next.js App Router and dynamic server routes.

### 1. Import Repository into Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New... &rarr; Project**.
2. Select your repository: `sanji-krishna-MP/UNREAL-VELTECH`.
3. Configure settings:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `next build` (leave default)
   - **Output Directory**: `.next` (leave default)

### 2. Environment Variables in Vercel
In Vercel **Project Settings &rarr; Environment Variables**, add the following required variable names:

| Variable Name | Environment | Description |
|---|---|---|
| `SUPABASE_URL` | Production, Preview, Development | Your Supabase project URL (`https://<project-ref>.supabase.co`) |
| `SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Supabase service-role secret key (server-only) |
| `APP_URL` | Production, Preview, Development | Your public Vercel domain (e.g. `https://cybershield.vercel.app`) |
| `GEMINI_API_KEY` | Production, Preview, Development | *(Optional)* Google Gemini API key for dynamic LLM generation |
| `GEMINI_MODEL` | Production, Preview, Development | *(Optional)* Default: `gemini-2.5-flash` |

> ⚠️ **Important**: Never paste sensitive keys into public code or git commits. Enter your keys securely in the Vercel dashboard.

### 3. Deploy
Click **Deploy**. Vercel will build and deploy the Next.js application.

---

## 🧪 Local Development & Testing

```bash
# Install dependencies
npm install

# Run Vitest test suite
npm test

# Run TypeScript type check
npx tsc --noEmit

# Run Next.js production build check
npm run build

# Start local development server
npm run dev
```

---

## 📂 Repository Structure

```
UNREAL-VELTECH/
├── public/                 # Static assets and icons
├── scripts/                # Verification and seed scripts
│   ├── seed-users.mjs      # Secure user provisioning & password rotation
│   └── verify-live-flow.mjs # 8-step live database verification
├── src/
│   ├── app/                # Next.js App Router (pages & server API routes)
│   │   ├── api/            # Server endpoints (campaigns, deliveries, training)
│   │   ├── dashboard/      # Security Officer console & analytics
│   │   ├── inbox/          # Employee simulation inbox
│   │   ├── training/       # Interactive micro-training lesson & quiz
│   │   └── login/          # Role-based authentication
│   ├── components/         # Reusable UI components & dark-mode charts
│   └── lib/                # HVI calculations, scoring rules, Supabase clients
├── supabase/
│   ├── migrations/         # Version-controlled migrations
│   ├── COMPLETE_CYBERSHIELD_SETUP.sql # Full idempotent database setup
│   └── README.md           # Database setup and schema documentation
├── .env.example            # Environment variable template (safe placeholders)
├── package.json            # Dependencies and build scripts
└── README.md               # Main project documentation
```
