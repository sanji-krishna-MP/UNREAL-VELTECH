# CyberShield — Supabase Database Architecture & Setup Guide

This directory contains the database schemas, Row Level Security (RLS) policies, Remote Procedure Calls (RPCs), and initial seed data for the **CyberShield** Phishing Simulation and Human Vulnerability Index platform.

---

## 1. Architecture Overview

CyberShield relies on Supabase (PostgreSQL with Auth and RLS) for secure multi-tenant and role-based operations:

```
auth.users (Supabase Managed)
    ├── profiles (role: 'officer' | 'employee', organization_id)
    └── employees (department_id, job_role, baseline_risk_score, current_risk_score)
           │
           ├── departments (Payroll, Engineering, etc.)
           │      └── organizations (Acme Corp / CyberShield Demo Org)
           │
           ├── deliveries (campaign_id, employee_id, personalized subject/body, token)
           │      ├── engagement_events (type: 'opened' | 'clicked' | 'reported')
           │      └── training_assignments (module_id, status: 'pending' | 'completed')
           │             └── training_attempts (score, passed, completed_at)
           │
           └── human_vulnerability_index (trend metrics, hvi_score)
```

---

## 2. Setup Instructions

### Option A: Via Supabase Web Dashboard (Recommended)

1. Open your Supabase Project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** in the left sidebar.
3. Open `supabase/COMPLETE_CYBERSHIELD_SETUP.sql` from this repository.
4. Copy and paste the entire script into the SQL Editor and click **Run**.
   - *Note*: This script is fully idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS`). It will **not** erase existing campaigns or live audit records.

### Option B: Via Supabase CLI

If you use the Supabase CLI:
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```
The migrations in `supabase/migrations/` will be applied in sequential order:
- `20261008000000_init_cybershield.sql`: Initial schema, tables, and training modules.
- `20261008000001_add_missing_rls_and_rpc.sql`: Non-recursive RLS policies and atomic SECURITY DEFINER RPCs.

---

## 3. Provisioning Users & Credentials

To seed or rotate demo users securely:

1. Configure your `.env.local`:
   ```bash
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   DEMO_OFFICER_PASSWORD=<secure-password>
   DEMO_EMPLOYEE_PASSWORD=<secure-password>
   ```
2. Run the secure seeding script:
   ```bash
   node scripts/seed-users.mjs
   ```
   If environment passwords are omitted, the script generates cryptographically secure random passwords and prints them only to your local terminal console.

---

## 4. Key Security & RLS Features

1. **Non-Recursive Profiles Policy**:
   - `profiles` SELECT / UPDATE policies check `user_id = auth.uid()` without querying `profiles` inside the policy body, completely preventing circular recursion errors (infinite recursion HTTP 500).

2. **Atomic SECURITY DEFINER RPCs**:
   - `rpc_launch_campaign(p_campaign_id, p_user_id)`:
     - Validates `v_role = 'officer'`.
     - Validates `auth.uid() = p_user_id` caller identity.
     - Performs campaign launch, recipient matching, and delivery generation in a single atomic transaction.
   - `rpc_record_click_and_assign(p_delivery_id, p_user_id)`:
     - Validates that `p_user_id` matches the employee's `user_id` on the delivery.
     - Validates `auth.uid() = p_user_id`.
     - Records click engagement event idempotently and assigns relevant interactive training in one atomic step.

---

## 5. Verification

Run the automated live verification script against your Supabase instance:
```bash
node scripts/verify-live-flow.mjs
```
The script validates all 8 critical operational stages:
1. Supabase environment connectivity
2. Officer authentication
3. Employee authentication
4. Profile and department data accessibility
5. Campaign querying and creation
6. Delivery status tracking
7. Interactive training assignment records
8. Human Vulnerability Index (HVI) score calculations
