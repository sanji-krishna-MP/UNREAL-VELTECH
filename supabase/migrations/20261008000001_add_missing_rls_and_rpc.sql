-- ============================================================================
-- CYBERSHIELD: Additive Migration — Missing RLS Policies & RPC Functions
-- Safe to run on existing databases: Uses IF NOT EXISTS, DROP POLICY IF EXISTS,
-- and CREATE OR REPLACE FUNCTION. Does NOT reset or delete any existing data!
-- ============================================================================

-- 1. Organizations RLS Policy
DROP POLICY IF EXISTS "Authenticated users view organizations" ON public.organizations;
CREATE POLICY "Authenticated users view organizations" ON public.organizations
    FOR SELECT TO authenticated USING (true);

-- 2. Profiles RLS Policies
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 3. Departments RLS Policy (Allows officers and employees to view departments in their org)
DROP POLICY IF EXISTS "Users view own org departments" ON public.departments;
CREATE POLICY "Users view own org departments" ON public.departments
    FOR SELECT TO authenticated USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- 4. Employees RLS Policy (Allows employees to view own record, officers to view org employees)
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

DROP POLICY IF EXISTS "Users insert own employee" ON public.employees;
CREATE POLICY "Users insert own employee" ON public.employees
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own employee" ON public.employees;
CREATE POLICY "Users update own employee" ON public.employees
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 3. Campaigns RLS Policies (Allows officers to select, insert, and update drafts)
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

-- 4. Deliveries Insert & Update Policies (For campaign launching and updates)
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

-- 5. Engagement Events Insert Policy (Allows employee to record events for own delivery)
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

-- 6. Training Assignments Insert & Update Policies
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

-- 7. Training Attempts Policies
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
-- RPC: ATOMIC CAMPAIGN LAUNCH (rpc_launch_campaign)
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

    -- Caller identity check
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Caller identity mismatch: caller is not authorized for target user';
    END IF;

    -- Fetch campaign and ensure draft status
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

    -- Loop over target employees in the organization/cohort
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
-- RPC: ATOMIC CLICK & TRAINING ASSIGNMENT (rpc_record_click_and_assign)
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

    -- Caller identity check
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Caller identity mismatch: caller is not authorized for target user';
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
        'type', 'clicked',
        'delivery_id', p_delivery_id,
        'assignment_id', v_assignment_id,
        'module_id', v_module_id,
        'simulationAlert', true,
        'message', 'This was a harmless authorized cyber defense simulation.'
    );
END;
$$;

-- ============================================================================
-- RPC: ATOMIC OPEN / REPORT EVENT RECORDING (rpc_record_event)
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

-- ============================================================================
-- VERIFY / ENSURE DEMO USERS AND IDENTITIES EXIST
-- Password for all 3 demo accounts: CyberShield2026!
-- ============================================================================
DO $$
DECLARE
    v_officer_id UUID := '99999999-9999-9999-9999-999999999901';
    v_alex_id UUID := '99999999-9999-9999-9999-999999999902';
    v_devon_id UUID := '99999999-9999-9999-9999-999999999903';
    v_encrypted_pwd TEXT := crypt('CyberShield2026!', gen_salt('bf'));
BEGIN
    -- 1. Officer
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

    -- 2. Payroll Employee
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

    -- 3. Engineering Employee
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
