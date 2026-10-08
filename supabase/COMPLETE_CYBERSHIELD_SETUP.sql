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
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'officer' AND p.organization_id = profiles.organization_id)
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
-- AUTH USERS & PROFILES SEEDING (Password for all 3 accounts: CyberShield2026!)
-- ============================================================================

DO $$
DECLARE
    v_officer_id UUID := '99999999-9999-9999-9999-999999999901';
    v_alex_id UUID := '99999999-9999-9999-9999-999999999902';
    v_devon_id UUID := '99999999-9999-9999-9999-999999999903';
    v_encrypted_pwd TEXT := crypt('CyberShield2026!', gen_salt('bf'));
BEGIN
    -- 1. Officer: officer@cybershield.internal
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'officer@cybershield.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_officer_id, 'authenticated', 'authenticated',
            'officer@cybershield.internal', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Chief Security Officer Morgan"}',
            now(), now()
        );
    ELSE
        SELECT id INTO v_officer_id FROM auth.users WHERE email = 'officer@cybershield.internal';
        UPDATE auth.users SET encrypted_password = v_encrypted_pwd WHERE id = v_officer_id;
    END IF;

    INSERT INTO public.profiles (user_id, organization_id, role)
    VALUES (v_officer_id, '00000000-0000-0000-0000-000000000001', 'officer')
    ON CONFLICT (user_id) DO UPDATE SET role = 'officer';

    -- 2. Payroll Employee: payroll.alex@cybershield.internal
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'payroll.alex@cybershield.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_alex_id, 'authenticated', 'authenticated',
            'payroll.alex@cybershield.internal', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Alex Rivera"}',
            now(), now()
        );
    ELSE
        SELECT id INTO v_alex_id FROM auth.users WHERE email = 'payroll.alex@cybershield.internal';
        UPDATE auth.users SET encrypted_password = v_encrypted_pwd WHERE id = v_alex_id;
    END IF;

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
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_devon_id, 'authenticated', 'authenticated',
            'eng.devon@cybershield.internal', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Devon Vance"}',
            now(), now()
        );
    ELSE
        SELECT id INTO v_devon_id FROM auth.users WHERE email = 'eng.devon@cybershield.internal';
        UPDATE auth.users SET encrypted_password = v_encrypted_pwd WHERE id = v_devon_id;
    END IF;

    INSERT INTO public.profiles (user_id, organization_id, role)
    VALUES (v_devon_id, '00000000-0000-0000-0000-000000000001', 'employee')
    ON CONFLICT (user_id) DO UPDATE SET role = 'employee';

    INSERT INTO public.employees (user_id, department_id, display_name, job_role)
    VALUES (v_devon_id, '22222222-2222-2222-2222-222222222222', 'Devon Vance', 'Senior Staff Engineer')
    ON CONFLICT (user_id) DO UPDATE SET display_name = 'Devon Vance', job_role = 'Senior Staff Engineer';
END;
$$;
