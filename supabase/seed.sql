-- ============================================================================
-- CYBERSHIELD SEED SCRIPT
-- Populates Organization, Departments, Modules, and Answer Keys
-- ============================================================================

-- 1. Organization
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Apex Defense Systems')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Departments
INSERT INTO public.departments (id, organization_id, name)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Payroll'),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Engineering')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Training Module 1: Payroll Direct Deposit
INSERT INTO public.training_modules (
    id, scenario, title, lesson, questions
) VALUES (
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
) ON CONFLICT (scenario) DO UPDATE SET 
    title = EXCLUDED.title,
    lesson = EXCLUDED.lesson,
    questions = EXCLUDED.questions;

-- Answer key for Module 1 (Indices: Q1 -> 3, Q2 -> 1, Q3 -> 2)
INSERT INTO public.training_answer_keys (module_id, correct_answers)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"q1": 3, "q2": 1, "q3": 2}'::jsonb
) ON CONFLICT (module_id) DO UPDATE SET correct_answers = EXCLUDED.correct_answers;

-- 4. Training Module 2: Engineering Repo Access
INSERT INTO public.training_modules (
    id, scenario, title, lesson, questions
) VALUES (
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
) ON CONFLICT (scenario) DO UPDATE SET 
    title = EXCLUDED.title,
    lesson = EXCLUDED.lesson,
    questions = EXCLUDED.questions;

-- Answer key for Module 2 (Indices: Q1 -> 1, Q2 -> 1, Q3 -> 2)
INSERT INTO public.training_answer_keys (module_id, correct_answers)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '{"q1": 1, "q2": 1, "q3": 2}'::jsonb
) ON CONFLICT (module_id) DO UPDATE SET correct_answers = EXCLUDED.correct_answers;
