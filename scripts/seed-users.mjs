import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local or .env
const envLocalPath = resolve(__dirname, '../.env.local');
const envPath = resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Please configure your .env.local file first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const PAYROLL_DEPT_ID = '11111111-1111-1111-1111-111111111111';
const ENG_DEPT_ID = '22222222-2222-2222-2222-222222222222';

import crypto from 'crypto';

const defaultDemoPassword = process.env.DEMO_PASSWORD || process.env.DEMO_USER_PASSWORD;
const generatedPassword = !defaultDemoPassword ? `CS-${crypto.randomBytes(8).toString('hex')}!9` : null;
const resolvedPassword = defaultDemoPassword || generatedPassword;

if (generatedPassword) {
  console.log(`\n[SECURITY] No DEMO_PASSWORD provided in environment. Auto-generated secure credential for rotation: ${generatedPassword}\n`);
}

const SEED_USERS = [
  {
    email: 'officer@cybershield.internal',
    password: process.env.DEMO_OFFICER_PASSWORD || resolvedPassword,
    role: 'officer',
    displayName: 'Chief Security Officer Morgan',
    jobRole: 'Director of Information Security',
    deptId: null
  },
  {
    email: 'payroll.alex@cybershield.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || resolvedPassword,
    role: 'employee',
    displayName: 'Alex Rivera',
    jobRole: 'Payroll Specialist',
    deptId: PAYROLL_DEPT_ID
  },
  {
    email: 'eng.devon@cybershield.internal',
    password: process.env.DEMO_EMPLOYEE_PASSWORD || resolvedPassword,
    role: 'employee',
    displayName: 'Devon Vance',
    jobRole: 'Senior Staff Engineer',
    deptId: ENG_DEPT_ID
  }
];

async function seed() {
  console.log('--- Starting CyberShield Seed ---');
  
  // Ensure Org and Depts exist
  await supabase.from('organizations').upsert({
    id: ORG_ID,
    name: 'Apex Defense Systems'
  });
  
  await supabase.from('departments').upsert([
    { id: PAYROLL_DEPT_ID, organization_id: ORG_ID, name: 'Payroll' },
    { id: ENG_DEPT_ID, organization_id: ORG_ID, name: 'Engineering' }
  ]);

  for (const userDef of SEED_USERS) {
    console.log(`Processing: ${userDef.email} (${userDef.role})`);
    
    // Check if auth user exists
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    let authUser = listData.users.find(u => u.email === userDef.email);

    if (!authUser) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: userDef.email,
        password: userDef.password,
        email_confirm: true,
        user_metadata: { display_name: userDef.displayName }
      });
      if (createError) {
        console.error(`Error creating user ${userDef.email}:`, createError);
        continue;
      }
      authUser = createData.user;
      console.log(`Created auth user: ${authUser.id}`);
    } else {
      // Update password to ensure it matches
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: userDef.password,
        email_confirm: true
      });
      console.log(`Updated existing auth user: ${authUser.id}`);
    }

    // Upsert Profile
    const { error: profError } = await supabase.from('profiles').upsert({
      user_id: authUser.id,
      organization_id: ORG_ID,
      role: userDef.role
    });
    if (profError) console.error('Profile upsert error:', profError);

    // Upsert Employee if employee role
    if (userDef.role === 'employee') {
      const { error: empError } = await supabase.from('employees').upsert({
        user_id: authUser.id,
        department_id: userDef.deptId,
        display_name: userDef.displayName,
        job_role: userDef.jobRole
      }, { onConflict: 'user_id' });
      if (empError) console.error('Employee upsert error:', empError);
    }
  }

  console.log('--- Seeding Complete Successfully! ---');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
