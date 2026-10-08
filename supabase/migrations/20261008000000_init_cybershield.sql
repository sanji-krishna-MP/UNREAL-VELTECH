-- ============================================================================
-- CYBERSHIELD: Initial Schema & RLS Policies
-- Target: Supabase PostgreSQL
-- ============================================================================

-- Enable pgcrypto / uuid extension
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

-- 8. Training Modules (Public safe metadata and questions)
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    lesson TEXT NOT NULL,
    questions JSONB NOT NULL, -- Array of { id, question, options: string[], explanation: string }
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Training Answer Keys (Server-only evaluation table; NEVER exposed to clients)
CREATE TABLE IF NOT EXISTS public.training_answer_keys (
    module_id UUID PRIMARY KEY REFERENCES public.training_modules(id) ON DELETE CASCADE,
    correct_answers JSONB NOT NULL, -- Map { q1: 1, q2: 0, q3: 2 }
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
CREATE INDEX IF NOT EXISTS idx_training_attempts_assignment ON public.training_attempts(assignment_id);

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

-- Answer keys: NEVER accessible via client queries
DROP POLICY IF EXISTS "No client access to answer keys" ON public.training_answer_keys;
CREATE POLICY "No client access to answer keys" ON public.training_answer_keys
    FOR ALL USING (false);

-- Modules: Readable by authenticated users
DROP POLICY IF EXISTS "Authenticated users view modules" ON public.training_modules;
CREATE POLICY "Authenticated users view modules" ON public.training_modules
    FOR SELECT TO authenticated USING (true);

-- Organizations: users view their own organization
DROP POLICY IF EXISTS "Users view own org" ON public.organizations;
CREATE POLICY "Users view own org" ON public.organizations
    FOR SELECT TO authenticated USING (
        id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    );

-- Profiles: users can view own profile
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'officer' AND p.organization_id = profiles.organization_id)
    );

-- Deliveries: Employees can only view their own deliveries; Officers view organization deliveries
DROP POLICY IF EXISTS "View deliveries policy" ON public.deliveries;
CREATE POLICY "View deliveries policy" ON public.deliveries
    FOR SELECT TO authenticated USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.campaigns c
            JOIN public.profiles p ON p.organization_id = c.organization_id
            WHERE c.id = deliveries.campaign_id AND p.user_id = auth.uid() AND p.role = 'officer'
        )
    );

-- Engagement events:
DROP POLICY IF EXISTS "View engagement events" ON public.engagement_events;
CREATE POLICY "View engagement events" ON public.engagement_events
    FOR SELECT TO authenticated USING (
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

-- Training assignments:
DROP POLICY IF EXISTS "View training assignments" ON public.training_assignments;
CREATE POLICY "View training assignments" ON public.training_assignments
    FOR SELECT TO authenticated USING (
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

-- ============================================================================
-- RPC: ATOMIC CAMPAIGN LAUNCH
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
    -- Verify officer role and organization
    SELECT role, organization_id INTO v_role, v_org_id
    FROM public.profiles
    WHERE user_id = p_user_id;

    IF v_role IS DISTINCT FROM 'officer' THEN
        RAISE EXCEPTION 'Unauthorized: Only security officers can launch campaigns';
    END IF;

    -- Fetch campaign and ensure draft status
    SELECT * INTO v_campaign
    FROM public.campaigns
    WHERE id = p_campaign_id AND organization_id = v_org_id;

    IF v_campaign IS NULL THEN
        RAISE EXCEPTION 'Campaign not found or does not belong to organization';
    END IF;

    IF v_campaign.status = 'launched' THEN
        -- Idempotent return: count existing deliveries
        SELECT count(*) INTO v_inserted_count FROM public.deliveries WHERE campaign_id = p_campaign_id;
        RETURN jsonb_build_object('success', true, 'status', 'already_launched', 'deliveries_count', v_inserted_count);
    END IF;

    v_target_dept_id := v_campaign.target_department_id;
    v_variants := COALESCE(v_campaign.variants, '[]'::jsonb);

    -- Loop over target employees
    FOR v_emp IN
        SELECT e.id, e.display_name, e.job_role, d.name AS dept_name, d.id AS dept_id
        FROM public.employees e
        JOIN public.departments d ON d.id = e.department_id
        WHERE d.organization_id = v_org_id
          AND (v_target_dept_id IS NULL OR e.department_id = v_target_dept_id)
    LOOP
        -- Determine variant matching employee role/dept
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
                -- Default to first variant
                v_matched_variant := v_variants->0;
                v_subject := v_matched_variant->>'subject';
                v_body := v_matched_variant->>'body';
                v_adaptation_reason := v_matched_variant->>'adaptation_reason';
            END IF;
        END IF;

        -- Fallback if no variant provided
        IF v_subject IS NULL OR v_body IS NULL THEN
            IF v_emp.dept_name ILIKE '%Payroll%' THEN
                v_subject := 'URGENT: Verify Updated Direct Deposit Account Details';
                v_body := 'Hello ' || v_emp.display_name || E',\n\nA pending change request was submitted to update your primary direct deposit banking routing number for upcoming payroll distribution. If you did not authorize this adjustment, you must verify your identity and confirm your payroll ledger immediately.\n\nPlease click the button below to review your deposit configuration.';
                v_adaptation_reason := 'Role-targeted payroll banking diversion simulation.';
            ELSE
                v_subject := 'ACTION REQUIRED: Security Audit - Verify Engineering SSH Key & Repo Permissions';
                v_body := 'Hello ' || v_emp.display_name || E',\n\nOur automated security scanning system detected an unverified SSH public key authorization request across internal repositories. To prevent repository commit revocation, review your registered credentials within the next 24 hours.\n\nPlease click the button below to verify your access.';
                v_adaptation_reason := 'Role-targeted repository credential verification simulation.';
            END IF;
        END IF;

        -- Insert delivery (Idempotent: ON CONFLICT DO NOTHING)
        INSERT INTO public.deliveries (campaign_id, employee_id, subject, body, difficulty, adaptation_reason)
        VALUES (p_campaign_id, v_emp.id, v_subject, v_body, v_campaign.default_difficulty, v_adaptation_reason)
        ON CONFLICT (campaign_id, employee_id) DO NOTHING;

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    -- Freeze and mark launched
    UPDATE public.campaigns
    SET status = 'launched',
        launched_at = timezone('utc'::text, now())
    WHERE id = p_campaign_id;

    RETURN jsonb_build_object('success', true, 'status', 'launched', 'deliveries_count', v_inserted_count);
END;
$$;

-- ============================================================================
-- RPC: ATOMIC CLICK & TRAINING ASSIGNMENT
-- ============================================================================
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
    -- Verify delivery and employee ownership
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

    -- 1. Insert Click Event (Atomic, Idempotent)
    INSERT INTO public.engagement_events (delivery_id, type, occurred_at)
    VALUES (p_delivery_id, 'clicked', timezone('utc'::text, now()))
    ON CONFLICT (delivery_id, type) DO NOTHING;

    -- 2. Find relevant training module for this scenario
    SELECT id INTO v_module_id
    FROM public.training_modules
    WHERE scenario = v_delivery.scenario
    LIMIT 1;

    -- If no specific scenario module found, fallback to first available module
    IF v_module_id IS NULL THEN
        SELECT id INTO v_module_id FROM public.training_modules LIMIT 1;
    END IF;

    IF v_module_id IS NULL THEN
        RAISE EXCEPTION 'No training module found for scenario';
    END IF;

    -- 3. Insert or get training assignment
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
        'delivery_id', p_delivery_id,
        'assignment_id', v_assignment_id,
        'module_id', v_module_id
    );
END;
$$;

-- ============================================================================
-- RPC: ATOMIC OPEN / REPORT EVENT RECORDING
-- ============================================================================
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
