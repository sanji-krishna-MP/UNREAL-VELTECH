# CyberShield

**Adaptive phishing simulations and immediate awareness training for enterprise teams.**

[Live demo](https://unreal-veltech.vercel.app/login) · [Source code](https://github.com/sanji-krishna-MP/UNREAL-VELTECH)

CyberShield helps security officers run controlled, role-specific mock spear-phishing campaigns. Employees respond inside a safe simulation inbox. Their interactions update an explainable **Human Vulnerability Index (HVI)**, and a simulated-link click immediately assigns relevant micro-training.

This project was built for the **CyberShield vibe-coding competition**. It is a software-only prototype using synthetic employees and demonstration data.

## Live demo accounts

Open **https://unreal-veltech.vercel.app/login** and use one of these competition accounts:

| Role | Email | Password |
| --- | --- | --- |
| Security Officer | officer@cybershield.internal | CyberShield2026! |
| Payroll Employee | payroll.alex@cybershield.internal | CyberShield2026! |
| Engineering Employee | eng.devon@cybershield.internal | CyberShield2026! |

> These shared accounts are for the competition demonstration only. They contain synthetic data. Passwords should be rotated after the event.

## What CyberShield does

| Feature | Behavior |
| --- | --- |
| Role-specific campaigns | Officers target Payroll or Engineering with scenarios relevant to each team. |
| Campaign management | Officers review and edit a message, save a draft, and launch a campaign. |
| Safe simulation inbox | Employees see their own deliveries and can open, report, or click a controlled mock link. |
| Immediate training | A simulated click assigns a topic-matched micro-module. |
| Interactive learning | Employees complete a short lesson and a three-question quiz with feedback. |
| Live persistence | Campaigns, deliveries, events, attempts, and completions are stored in Supabase PostgreSQL. |
| Explainable analytics | Officers see response coverage, training progress, and HVI. |
| Follow-up recommendations | The next suggested scenario and difficulty reflect the employee’s previous outcome and training status. |

Payroll simulations focus on suspicious direct-deposit changes. Engineering simulations focus on repository access and SSH/security-review requests. CyberShield does **not** send real phishing emails or collect employee credentials.

## Three-minute demo flow

1. Sign in as the **Security Officer**.
2. Create and launch a Payroll campaign.
3. Sign out and sign in as the **Payroll Employee**.
4. Open the delivered message and click its **Simulated link** action.
5. Show the immediate training assignment and complete the three-question module.
6. Return to the officer dashboard and refresh to show the recorded click, HVI, and training completion.

You can repeat the flow with the Engineering account to demonstrate department-specific messaging.

## How it works

```text
Officer or employee browser
          │
          ▼
Next.js application on Vercel
  ├─ React interface
  └─ Server routes for authentication, validation, and authorization
          │
          ▼
Supabase Auth + PostgreSQL
  ├─ Organizations, departments, and employee profiles
  ├─ Campaigns, deliveries, and engagement events
  ├─ Training modules, attempts, and assignments
  ├─ Row Level Security policies
  └─ Database functions for campaign launch and click assignment
```

The browser sends actions to Next.js server routes. The server checks the authenticated user, stored role, and record ownership. Supabase persists changes so they survive refreshes and new sessions.

### Technology stack

- **Application:** Next.js App Router, React, and TypeScript
- **Interface:** Tailwind CSS and reusable React components
- **Database and authentication:** Supabase PostgreSQL and Supabase Auth
- **Validation:** Zod
- **Tests:** Vitest
- **Hosting:** Vercel
- **Optional content generation:** Google Gemini through a server-side integration

Campaign templates remain available when an AI key is not configured. The interface should identify template-generated content as **Template mode**.

## Human Vulnerability Index

HVI is a **prototype risk heuristic** scored from 0 to 100. A higher score means greater observed risk in the simulations. It is not a certified or industry-standard security assessment.

| Delivery outcome | Risk points |
| --- | ---: |
| Any simulated-link click | 100 |
| Otherwise reported | 0 |
| Otherwise opened only | 25 |
| Otherwise expired without interaction | 0 |
| Unexpired with no interaction | Excluded |

```text
HVI = round(
  sum of eligible delivery risk points
  / number of eligible deliveries
)
```

A delivery is eligible after an interaction or after its response deadline passes. A click takes precedence over a later report. Completing training does not erase the historical click.

For example, one click, one report, and one open-only delivery produce:

```text
round((100 + 0 + 25) / 3) = 42
```

When no deliveries are eligible, CyberShield displays **Insufficient data**. HVI should be viewed alongside **response coverage**, because no interaction does not prove an employee recognized a suspicious message.

### Adaptive follow-up

| Previous outcome | Recommended follow-up |
| --- | --- |
| Failed simulation with training pending | Same topic, introductory difficulty |
| Failed simulation with training completed | Same topic, intermediate difficulty |

Each recommendation includes a plain-language reason. This adaptation uses transparent rules rather than claiming to be a machine-learning model.

## Security and data integrity

- Simulation links remain inside CyberShield; there are no external credential-collection pages.
- Employees can access only their own deliveries and training.
- Officer routes verify the authenticated user’s stored role.
- Server endpoints validate requests and enforce ownership checks.
- PostgreSQL Row Level Security restricts database access.
- Quiz answer keys are kept in a protected table and grading occurs on the server.
- Privileged Supabase and optional AI keys are server-side environment variables.
- Campaign launch and click-to-training operations use database functions for related writes.
- Repeated actions are designed to avoid duplicate deliveries and assignments.
- Application state is stored in the live database, not only in browser storage.

The published accounts above are deliberately shared **competition demo accounts**. They must not be reused for real employee data.

## Run locally

### Requirements

- Node.js compatible with the project’s Next.js version
- npm
- A Supabase project

Clone the repository and install locked dependencies:

```sh
git clone https://github.com/sanji-krishna-MP/UNREAL-VELTECH.git
cd UNREAL-VELTECH
npm ci
```

Create `.env.local` beside `package.json`:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret-key
APP_URL=http://localhost:3000

# Optional
GEMINI_API_KEY=
GEMINI_MODEL=
```

Never commit `.env.local`. The Supabase secret key must remain on the server and must never use a `NEXT_PUBLIC_` variable name.

Follow [supabase/README.md](supabase/README.md) and the files in [supabase/migrations](supabase/migrations) to initialize a new database. Use the documented seed script to create or rotate demo users. Review the current schema before applying setup SQL to an existing project.

Start the app:

```sh
npm run dev
```

Open **http://localhost:3000/login**. Restart the development server after changing `.env.local`.

## Verification

Run from the repository root:

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

The development team reported **14 passing unit tests**, a successful TypeScript check and production build, and **8 passing live Supabase flow checks** before deployment. Re-run these checks after later code changes.

The live database verification script is:

```sh
node scripts/verify-live-flow.mjs
```

It creates test records. Run it only against a database where those records are appropriate. Automated checks should be supplemented by testing the full journey through the deployed website.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Select **Next.js** and leave the root directory as `./`.
3. Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as Production environment variables.
4. Prepare the Supabase database and demo accounts. Deploying the code does not automatically apply SQL migrations.
5. Deploy the application. If required, set `APP_URL` to the final production URL and redeploy.
6. Test login, campaign launch, employee interaction, training completion, dashboard results, and refresh persistence on the public URL.

**Production demo:** https://unreal-veltech.vercel.app/login

## Repository structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Application pages and server API routes |
| `src/components/` | Reusable interface components |
| `src/lib/` | Authentication, scoring, adaptation, and database helpers |
| `supabase/migrations/` | Versioned database changes |
| `supabase/README.md` | Database setup and seeding guidance |
| `scripts/` | Setup and verification utilities |
| `public/` | Static assets |

## MVP boundaries

CyberShield currently uses an internal simulation inbox and two seeded departments. Real email or SMS delivery, employee imports, notifications, and advanced historical analytics are outside the first MVP. Any illustrative charts should be labeled **Sample data** and kept separate from live database metrics.
