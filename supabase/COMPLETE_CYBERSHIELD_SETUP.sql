-- ============================================================================
-- CYBERSHIELD COMPLETE ONE-CLICK SQL SETUP
-- Paste this entire script into your Supabase project's SQL Editor and click RUN.
-- It creates all tables, RLS policies, RPC functions, and seeds the initial data
-- including the 3 demo users (Officer, Payroll, Engineering).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('officer', 'employee')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    job_role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scenario TEXT NOT NULL,
    target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    default_difficulty TEXT NOT NULL CHECK (default_difficulty IN ('introductory', 'intermediate', 'advanced')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'launched')),
    response_deadline TIMESTAMPTZ NOT NULL,
    generation_mode TEXT NOT NULL DEFAULT 'Template mode',
    variants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    launched_at TIMESTAMPTZ
);

-- 6. Deliveries (Immutable snapshot on launch)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    adaptation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_campaign_employee UNIQUE (campaign_id, employee_id)
);

-- 7. Engagement Events
CREATE TABLE IF NOT EXISTS public.engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('opened', 'clicked', 'reported')),
    occurred_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_delivery_type UNIQUE (delivery_id, type)
);

-- 8. Training Modules
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    lesson TEXT NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Training Answer Keys (Server-only evaluation table)
CREATE TABLE IF NOT EXISTS public.training_answer_keys (
    module_id UUID PRIMARY KEY REFERENCES public.training_modules(id) ON DELETE CASCADE,
    correct_answers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Training Assignments
CREATE TABLE IF NOT EXISTS public.training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
    assigned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_delivery_module UNIQUE (delivery_id, module_id)
);

-- 11. Training Attempts
CREATE TABLE IF NOT EXISTS public.training_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.training_assignments(id) ON DELETE CASCADE,
    request_id UUID UNIQUE DEFAULT gen_random_uuid() NOT NULL,
    submitted_answers JSONB NOT NULL,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Generation Runs
CREATE TABLE IF NOT EXISTS public.generation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    mode TEXT NOT NULL,
    model TEXT,
    prompt_version TEXT,
    duration_ms INT,
    outcome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_campaign ON public.deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_employee ON public.deliveries(employee_id);
CREATE INDEX IF NOT EXISTS idx_engagement_delivery ON public.engagement_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_delivery ON public.training_assignments(delivery_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to answer keys" ON public.training_answer_keys;
CREATE POLICY "No client access to answer keys" ON public.training_answer_keys FOR ALL USING (false);

DROP POLICY IF EXISTS "Authenticated users view modules" ON public.training_modules;
CREATE POLICY "Authenticated users view modules" ON public.training_modules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users view own org" ON public.organizations;
CREATE POLICY "Users view own org" ON public.organizations FOR SELECT TO authenticated USING (
    id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "View deliveries policy" ON public.deliveries;
CREATE POLICY "View deliveries policy" ON public.deliveries FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR
    EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.profiles p ON p.organization_id = c.organization_id
        WHERE c.id = deliveries.campaign_id AND p.user_id = auth.uid() AND p.role = 'officer'
    )
);

DROP POLICY IF EXISTS "Officers insert deliveries" ON public.deliveries;
CREATE POLICY "Officers insert deliveries" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.profiles p ON p.organization_id = c.organization_id
        WHERE c.id = deliveries.campaign_id AND p.user_id = auth.uid() AND p.role = 'officer'
    )
);

DROP POLICY IF EXISTS "View engagement events" ON public.engagement_events;
CREATE POLICY "View engagement events" ON public.engagement_events FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.deliveries d
        WHERE d.id = engagement_events.delivery_id AND (
            d.employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM public.campaigns c
                JOIN public.profiles p ON p.organization_id = c.organization_id
                WHERE c.id = d.campaign_id AND p.user_id = auth.uid() AND p.role = 'officer'
            )
        )
    )
);

DROP POLICY IF EXISTS "View training assignments" ON public.training_assignments;
CREATE POLICY "View training assignments" ON public.training_assignments FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.deliveries d
        WHERE d.id = training_assignments.delivery_id AND (
            d.employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM public.campaigns c
                JOIN public.profiles p ON p.organization_id = c.organization_id
                WHERE c.id = d.campaign_id AND p.user_id = auth.uid() AND p.role = 'officer'
            )
        )
    )
);

-- Departments Policy
DROP POLICY IF EXISTS "Users view own org departments" ON public.departments;
CREATE POLICY "Users view own org departments" ON public.departments
    FOR SELECT TO authenticated USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Employees Policy
DROP POLICY IF EXISTS "View employees policy" ON public.employees;
CREATE POLICY "View employees policy" ON public.employees
    FOR SELECT TO authenticated USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.departments d
            JOIN public.profiles p ON p.organization_id = d.organization_id
            WHERE d.id = employees.department_id AND p.user_id = auth.uid() AND p.role = 'officer'
        )
    );

-- Campaigns Policies
DROP POLICY IF EXISTS "Officers view own org campaigns" ON public.campaigns;
CREATE POLICY "Officers view own org campaigns" ON public.campaigns
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.organization_id = campaigns.organization_id
              AND p.user_id = auth.uid()
              AND p.role = 'officer'
        )
    );

DROP POLICY IF EXISTS "Officers insert own org campaigns" ON public.campaigns;
CREATE POLICY "Officers insert own org campaigns" ON public.campaigns
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.organization_id = campaigns.organization_id
              AND p.user_id = auth.uid()
              AND p.role = 'officer'
        )
    );

DROP POLICY IF EXISTS "Officers update own org draft campaigns" ON public.campaigns;
CREATE POLICY "Officers update own org draft campaigns" ON public.campaigns
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.organization_id = campaigns.organization_id
              AND p.user_id = auth.uid()
              AND p.role = 'officer'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.organization_id = campaigns.organization_id
              AND p.user_id = auth.uid()
              AND p.role = 'officer'
        )
    );

-- Deliveries Insert & Update Policies
DROP POLICY IF EXISTS "Officers insert deliveries" ON public.deliveries;
CREATE POLICY "Officers insert deliveries" ON public.deliveries
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            JOIN public.profiles p ON p.organization_id = c.organization_id
            WHERE c.id = deliveries.campaign_id
              AND p.user_id = auth.uid()
              AND p.role = 'officer'
        )
    );

-- Engagement Events Insert Policy
DROP POLICY IF EXISTS "Employees insert own events" ON public.engagement_events;
CREATE POLICY "Employees insert own events" ON public.engagement_events
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.employees e ON e.id = d.employee_id
            WHERE d.id = engagement_events.delivery_id
              AND e.user_id = auth.uid()
        )
    );

-- Training Assignments Insert & Update Policies
DROP POLICY IF EXISTS "Insert training assignments" ON public.training_assignments;
CREATE POLICY "Insert training assignments" ON public.training_assignments
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.employees e ON e.id = d.employee_id
            WHERE d.id = training_assignments.delivery_id
              AND e.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.campaigns c ON c.id = d.campaign_id
            JOIN public.profiles p ON p.organization_id = c.organization_id
            WHERE d.id = training_assignments.delivery_id
              AND p.user_id = auth.uid()
              AND p.role = 'officer'
        )
    );

DROP POLICY IF EXISTS "Employees update own training assignments" ON public.training_assignments;
CREATE POLICY "Employees update own training assignments" ON public.training_assignments
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.employees e ON e.id = d.employee_id
            WHERE d.id = training_assignments.delivery_id
              AND e.user_id = auth.uid()
        )
    );

-- Training Attempts Policies
DROP POLICY IF EXISTS "View training attempts" ON public.training_attempts;
CREATE POLICY "View training attempts" ON public.training_attempts
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.training_assignments ta
            JOIN public.deliveries d ON d.id = ta.delivery_id
            JOIN public.employees e ON e.id = d.employee_id
            WHERE ta.id = training_attempts.assignment_id
              AND (
                  e.user_id = auth.uid()
                  OR
                  EXISTS (
                      SELECT 1 FROM public.campaigns c
                      JOIN public.profiles p ON p.organization_id = c.organization_id
                      WHERE c.id = d.campaign_id AND p.user_id = auth.uid() AND p.role = 'officer'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Insert training attempts" ON public.training_attempts;
CREATE POLICY "Insert training attempts" ON public.training_attempts
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.training_assignments ta
            JOIN public.deliveries d ON d.id = ta.delivery_id
            JOIN public.employees e ON e.id = d.employee_id
            WHERE ta.id = training_attempts.assignment_id
              AND e.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_launch_campaign(p_campaign_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
    v_org_id UUID;
    v_campaign RECORD;
    v_target_dept_id UUID;
    v_emp RECORD;
    v_inserted_count INT := 0;
    v_subject TEXT;
    v_body TEXT;
    v_adaptation_reason TEXT;
    v_variants JSONB;
    v_matched_variant JSONB;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller identity does not match specified user ID';
    END IF;

    SELECT role, organization_id INTO v_role, v_org_id
    FROM public.profiles
    WHERE user_id = p_user_id;

    IF v_role IS DISTINCT FROM 'officer' THEN
        RAISE EXCEPTION 'Unauthorized: Only security officers can launch campaigns';
    END IF;

    SELECT * INTO v_campaign
    FROM public.campaigns
    WHERE id = p_campaign_id AND organization_id = v_org_id;

    IF v_campaign IS NULL THEN
        RAISE EXCEPTION 'Campaign not found or does not belong to organization';
    END IF;

    IF v_campaign.status = 'launched' THEN
        SELECT count(*) INTO v_inserted_count FROM public.deliveries WHERE campaign_id = p_campaign_id;
        RETURN jsonb_build_object('success', true, 'status', 'already_launched', 'deliveries_count', v_inserted_count);
    END IF;

    v_target_dept_id := v_campaign.target_department_id;
    v_variants := COALESCE(v_campaign.variants, '[]'::jsonb);

    FOR v_emp IN
        SELECT e.id, e.display_name, e.job_role, d.name AS dept_name, d.id AS dept_id
        FROM public.employees e
        JOIN public.departments d ON d.id = e.department_id
        WHERE d.organization_id = v_org_id
          AND (v_target_dept_id IS NULL OR e.department_id = v_target_dept_id)
    LOOP
        v_subject := NULL;
        v_body := NULL;
        v_adaptation_reason := NULL;

        IF jsonb_array_length(v_variants) > 0 THEN
            SELECT elem INTO v_matched_variant
            FROM jsonb_array_elements(v_variants) elem
            WHERE elem->>'department_name' ILIKE '%' || v_emp.dept_name || '%'
               OR elem->>'job_role' ILIKE '%' || v_emp.job_role || '%'
            LIMIT 1;

            IF v_matched_variant IS NOT NULL THEN
                v_subject := v_matched_variant->>'subject';
                v_body := v_matched_variant->>'body';
                v_adaptation_reason := v_matched_variant->>'adaptation_reason';
            ELSE
                v_matched_variant := v_variants->0;
                v_subject := v_matched_variant->>'subject';
                v_body := v_matched_variant->>'body';
                v_adaptation_reason := v_matched_variant->>'adaptation_reason';
            END IF;
        END IF;

        IF v_subject IS NULL OR v_body IS NULL THEN
            IF v_emp.dept_name ILIKE '%Payroll%' THEN
                v_subject := 'URGENT: Verify Updated Direct Deposit Account Details';
                v_body := 'Hello ' || v_emp.display_name || E',\n\nA pending change request was submitted to update your primary direct deposit banking routing number for upcoming payroll distribution. If you did not authorize this adjustment, you must verify your identity immediately.\n\nPlease click the button below to review your deposit configuration.';
                v_adaptation_reason := 'Role-targeted payroll banking diversion simulation.';
            ELSE
                v_subject := 'ACTION REQUIRED: Security Audit - Verify Engineering SSH Key & Repo Permissions';
                v_body := 'Hello ' || v_emp.display_name || E',\n\nOur automated security scanning system detected an unverified SSH public key authorization request across internal repositories. To prevent repository commit revocation, review your registered credentials within the next 24 hours.\n\nPlease click the button below to verify your access.';
                v_adaptation_reason := 'Role-targeted repository credential verification simulation.';
            END IF;
        END IF;

        INSERT INTO public.deliveries (campaign_id, employee_id, subject, body, difficulty, adaptation_reason)
        VALUES (p_campaign_id, v_emp.id, v_subject, v_body, v_campaign.default_difficulty, v_adaptation_reason)
        ON CONFLICT (campaign_id, employee_id) DO NOTHING;

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    UPDATE public.campaigns
    SET status = 'launched',
        launched_at = timezone('utc'::text, now())
    WHERE id = p_campaign_id;

    RETURN jsonb_build_object('success', true, 'status', 'launched', 'deliveries_count', v_inserted_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_record_click_and_assign(p_delivery_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_delivery RECORD;
    v_employee RECORD;
    v_module_id UUID;
    v_assignment_id UUID;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller identity does not match specified user ID';
    END IF;

    SELECT d.*, c.scenario INTO v_delivery
    FROM public.deliveries d
    JOIN public.campaigns c ON c.id = d.campaign_id
    WHERE d.id = p_delivery_id;

    IF v_delivery IS NULL THEN
        RAISE EXCEPTION 'Delivery record not found';
    END IF;

    SELECT * INTO v_employee
    FROM public.employees
    WHERE id = v_delivery.employee_id AND user_id = p_user_id;

    IF v_employee IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User does not own this delivery record';
    END IF;

    INSERT INTO public.engagement_events (delivery_id, type, occurred_at)
    VALUES (p_delivery_id, 'clicked', timezone('utc'::text, now()))
    ON CONFLICT (delivery_id, type) DO NOTHING;

    SELECT id INTO v_module_id
    FROM public.training_modules
    WHERE scenario = v_delivery.scenario
    LIMIT 1;

    IF v_module_id IS NULL THEN
        SELECT id INTO v_module_id FROM public.training_modules LIMIT 1;
    END IF;

    IF v_module_id IS NULL THEN
        RAISE EXCEPTION 'No training module found for scenario';
    END IF;

    INSERT INTO public.training_assignments (delivery_id, module_id, status, assigned_at)
    VALUES (p_delivery_id, v_module_id, 'assigned', timezone('utc'::text, now()))
    ON CONFLICT (delivery_id, module_id)
    DO UPDATE SET status = public.training_assignments.status
    RETURNING id INTO v_assignment_id;

    IF v_assignment_id IS NULL THEN
        SELECT id INTO v_assignment_id
        FROM public.training_assignments
        WHERE delivery_id = p_delivery_id AND module_id = v_module_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'type', 'clicked',
        'delivery_id', p_delivery_id,
        'assignment_id', v_assignment_id,
        'module_id', v_module_id,
        'simulationAlert', true,
        'message', 'This was a harmless authorized cyber defense simulation.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_record_event(p_delivery_id UUID, p_type TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_delivery RECORD;
    v_employee RECORD;
BEGIN
    IF p_type NOT IN ('opened', 'reported') THEN
        RAISE EXCEPTION 'Invalid event type. Use rpc_record_click_and_assign for clicks.';
    END IF;

    SELECT d.* INTO v_delivery
    FROM public.deliveries d
    WHERE d.id = p_delivery_id;

    IF v_delivery IS NULL THEN
        RAISE EXCEPTION 'Delivery record not found';
    END IF;

    SELECT * INTO v_employee
    FROM public.employees
    WHERE id = v_delivery.employee_id AND user_id = p_user_id;

    IF v_employee IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User does not own this delivery record';
    END IF;

    INSERT INTO public.engagement_events (delivery_id, type, occurred_at)
    VALUES (p_delivery_id, p_type, timezone('utc'::text, now()))
    ON CONFLICT (delivery_id, type) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'type', p_type, 'delivery_id', p_delivery_id);
END;
$$;


-- ============================================================================
-- SEED DATA: ORGANIZATIONS, DEPARTMENTS, MODULES, ANSWER KEYS
-- ============================================================================

INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Apex Defense Systems')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.departments (id, organization_id, name)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Payroll'),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Engineering')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Payroll Module
INSERT INTO public.training_modules (id, scenario, title, lesson, questions)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'payroll_direct_deposit',
    'Payroll Diversion & Direct Deposit Phishing Defense',
    E'# Identifying Payroll Redirection Scams\n\nDirect deposit phishing is one of the most lucrative and targeted attacks against finance and corporate employees. Cybercriminals craft convincing emails claiming your direct deposit details require immediate verification or have failed.\n\n### Critical Red Flags to Watch For:\n1. **Artificial Urgency**: Threats of delayed paychecks or immediate account suspension if you do not click within 24 hours.\n2. **Lookalike Domains & Display Names**: Senders masquerading as HR or payroll providers (e.g., `payroll-support@acmme-corp.com` instead of the internal intranet domain).\n3. **Unsolicited Update Prompts**: Legitimate payroll systems never email unexpected links asking you to confirm bank account numbers or routing details.\n\n### The Golden Rule of Out-of-Band Verification:\nNever click links in payroll notification emails. Always navigate directly to your known internal HR portal through bookmarked links or contact HR in person or via verified Slack/Teams channels.',
    '[
        {
            "id": "q1",
            "question": "An urgent email claims your direct deposit will fail unless you update your bank routing number immediately. What is the safest immediate action?",
            "options": [
                "Click the link promptly to ensure your paycheck arrives on time.",
                "Reply to the email asking for confirmation from the sender.",
                "Forward the link to your personal email to verify it on a mobile device.",
                "Do not click. Report the email and verify your direct deposit directly via your company HR portal."
            ],
            "explanation": "Legitimate payroll departments never demand urgent banking updates through raw links. Always verify out-of-band."
        },
        {
            "id": "q2",
            "question": "Which of the following sender email addresses indicates a spoofed lookalike domain for ACME Corp?",
            "options": [
                "payroll@acme.com",
                "hr-support@acme-internal-verify.com",
                "benefits@acme.com",
                "security@acme.com"
            ],
            "explanation": "Lookalike domains append extra words (like acme-internal-verify.com) to deceive recipients into trusting unauthorized third parties."
        },
        {
            "id": "q3",
            "question": "What is the primary indicator that an email is attempting social engineering rather than a normal notification?",
            "options": [
                "It contains the corporate logo.",
                "It is sent during regular business hours.",
                "It uses manufactured urgency and fear of financial penalty to bypass critical scrutiny.",
                "It includes the recipient display name."
            ],
            "explanation": "Attackers exploit emotional pressure and time-sensitive threats so victims act before thinking critically."
        }
    ]'::jsonb
) ON CONFLICT (scenario) DO UPDATE SET title = EXCLUDED.title, lesson = EXCLUDED.lesson, questions = EXCLUDED.questions;

INSERT INTO public.training_answer_keys (module_id, correct_answers)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"q1": 3, "q2": 1, "q3": 2}'::jsonb)
ON CONFLICT (module_id) DO UPDATE SET correct_answers = EXCLUDED.correct_answers;

-- Engineering Module
INSERT INTO public.training_modules (id, scenario, title, lesson, questions)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'engineering_repo_access',
    'Engineering Repository Credential & SSH Phishing Defense',
    E'# Defending Engineering Access & CI/CD Pipelines\n\nSoftware engineers and DevOps personnel are prime targets for credential harvesting and OAuth consent phishing. Attackers impersonate source code repositories (GitHub, GitLab, AWS, Bitbucket) to steal SSH keys, personal access tokens (PATs), and developer sessions.\n\n### Attack Tactics in Engineering Scenarios:\n1. **Fake Security Audits**: Urgent alerts claiming an unauthorized SSH key or commit was detected on your branch, requiring you to re-authenticate immediately.\n2. **OAuth Device Authorization Scams**: Tricking developers into granting broad repository read/write permissions to a rogue third-party OAuth app.\n3. **Deceptive URLs**: Domains like `github-audit-security.io` or `gitlab-verify.net` masquerading as official developer tools.\n\n### Defense Protocols:\n- Never enter credentials or review SSH keys through email links.\n- Inspect the browser URL bar meticulously; official git platforms only use their authenticated canonical root domains.\n- Use hardware security keys (FIDO2/WebAuthn) that enforce domain binding and prevent credential replay.',
    '[
        {
            "id": "q1",
            "question": "You receive an email claiming an unauthorized SSH key was linked to your GitHub account with a button to \'Revoke Access Now\'. What is the correct response?",
            "options": [
                "Click the button and enter your 2FA code to lock the account immediately.",
                "Do not click the button. Open your browser, navigate to your repository settings directly, and check your authorized keys.",
                "Download any attached patch file to check if your commits were tampered with.",
                "Forward the email to all engineering team members to see if they got it too."
            ],
            "explanation": "Always navigate directly to your account settings via a trusted bookmark or URL, never via an email action button."
        },
        {
            "id": "q2",
            "question": "Why are FIDO2 / WebAuthn hardware security keys highly effective against spear-phishing attacks?",
            "options": [
                "They require a complex 16-character alphanumeric passphrase.",
                "They cryptographically bind authentication to the exact browser domain, preventing credentials from being sent to phishing sites.",
                "They change the user password automatically every hour.",
                "They prevent malware from executing on local machines."
            ],
            "explanation": "WebAuthn domain binding ensures that even if you submit authentication on a fake domain, the key will not sign the request for that origin."
        },
        {
            "id": "q3",
            "question": "What is OAuth Consent Phishing in an engineering environment?",
            "options": [
                "A physical intruder stealing laptops from the office.",
                "A brute-force dictionary attack against SSH port 22.",
                "Tricking an engineer into authorizing a malicious third-party app that requests repository read/write scopes.",
                "An expired SSL certificate on an internal staging server."
            ],
            "explanation": "Consent phishing tricks developers into granting third-party OAuth permissions, bypassing passwords and 2FA entirely."
        }
    ]'::jsonb
) ON CONFLICT (scenario) DO UPDATE SET title = EXCLUDED.title, lesson = EXCLUDED.lesson, questions = EXCLUDED.questions;

INSERT INTO public.training_answer_keys (module_id, correct_answers)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"q1": 1, "q2": 1, "q3": 2}'::jsonb)
ON CONFLICT (module_id) DO UPDATE SET correct_answers = EXCLUDED.correct_answers;

-- ============================================================================
-- AUTH USERS & PROFILES SEEDING
-- Set passwords via environment variable / npm run seed:users, or configure
-- your private password below before running in Supabase SQL editor.
-- ============================================================================

DO $$
DECLARE
    v_officer_id UUID := '99999999-9999-9999-9999-999999999901';
    v_alex_id UUID := '99999999-9999-9999-9999-999999999902';
    v_devon_id UUID := '99999999-9999-9999-9999-999999999903';
    -- Configure your private demo password here or seed securely via node scripts/seed-users.mjs
    v_demo_password TEXT := coalesce(nullif(current_setting('app.demo_password', true), ''), 'SET_SECURE_PASSWORD_HERE');
    v_encrypted_pwd TEXT := crypt(v_demo_password, gen_salt('bf'));
BEGIN
    -- 1. Officer: officer@cybershield.internal
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'officer@cybershield.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_officer_id, 'authenticated', 'authenticated',
            'officer@cybershield.internal', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Chief Security Officer Morgan"}',
            now(), now(), '', '', '', ''
        );
    ELSE
        SELECT id INTO v_officer_id FROM auth.users WHERE email = 'officer@cybershield.internal';
        UPDATE auth.users SET encrypted_password = v_encrypted_pwd, email_confirmed_at = now() WHERE id = v_officer_id;
    END IF;

    BEGIN
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (v_officer_id::text, v_officer_id, jsonb_build_object('sub', v_officer_id::text, 'email', 'officer@cybershield.internal'), 'email', v_officer_id::text, now(), now(), now())
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    INSERT INTO public.profiles (user_id, organization_id, role)
    VALUES (v_officer_id, '00000000-0000-0000-0000-000000000001', 'officer')
    ON CONFLICT (user_id) DO UPDATE SET role = 'officer';

    -- 2. Payroll Employee: payroll.alex@cybershield.internal
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'payroll.alex@cybershield.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_alex_id, 'authenticated', 'authenticated',
            'payroll.alex@cybershield.internal', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Alex Rivera"}',
            now(), now(), '', '', '', ''
        );
    ELSE
        SELECT id INTO v_alex_id FROM auth.users WHERE email = 'payroll.alex@cybershield.internal';
        UPDATE auth.users SET encrypted_password = v_encrypted_pwd, email_confirmed_at = now() WHERE id = v_alex_id;
    END IF;

    BEGIN
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (v_alex_id::text, v_alex_id, jsonb_build_object('sub', v_alex_id::text, 'email', 'payroll.alex@cybershield.internal'), 'email', v_alex_id::text, now(), now(), now())
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    INSERT INTO public.profiles (user_id, organization_id, role)
    VALUES (v_alex_id, '00000000-0000-0000-0000-000000000001', 'employee')
    ON CONFLICT (user_id) DO UPDATE SET role = 'employee';

    INSERT INTO public.employees (user_id, department_id, display_name, job_role)
    VALUES (v_alex_id, '11111111-1111-1111-1111-111111111111', 'Alex Rivera', 'Payroll Specialist')
    ON CONFLICT (user_id) DO UPDATE SET display_name = 'Alex Rivera', job_role = 'Payroll Specialist';

    -- 3. Engineering Employee: eng.devon@cybershield.internal
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'eng.devon@cybershield.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_devon_id, 'authenticated', 'authenticated',
            'eng.devon@cybershield.internal', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Devon Vance"}',
            now(), now(), '', '', '', ''
        );
    ELSE
        SELECT id INTO v_devon_id FROM auth.users WHERE email = 'eng.devon@cybershield.internal';
        UPDATE auth.users SET encrypted_password = v_encrypted_pwd, email_confirmed_at = now() WHERE id = v_devon_id;
    END IF;

    BEGIN
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (v_devon_id::text, v_devon_id, jsonb_build_object('sub', v_devon_id::text, 'email', 'eng.devon@cybershield.internal'), 'email', v_devon_id::text, now(), now(), now())
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    INSERT INTO public.profiles (user_id, organization_id, role)
    VALUES (v_devon_id, '00000000-0000-0000-0000-000000000001', 'employee')
    ON CONFLICT (user_id) DO UPDATE SET role = 'employee';

    INSERT INTO public.employees (user_id, department_id, display_name, job_role)
    VALUES (v_devon_id, '22222222-2222-2222-2222-222222222222', 'Devon Vance', 'Senior Staff Engineer')
    ON CONFLICT (user_id) DO UPDATE SET display_name = 'Devon Vance', job_role = 'Senior Staff Engineer';
END;
$$;
