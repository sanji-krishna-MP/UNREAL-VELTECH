import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let user = authData?.user;

    if (authError || !user) {
      // Auto-provision demo users if not yet created in Supabase Auth
      const isDemoUser = [
        'officer@cybershield.internal',
        'payroll.alex@cybershield.internal',
        'eng.devon@cybershield.internal',
      ].includes(email.toLowerCase());

      if (isDemoUser && password === 'CyberShield2026!') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (!signUpError && signUpData.user) {
          user = signUpData.user;
          // Re-sign in to establish session cookies
          const { data: reAuth } = await supabase.auth.signInWithPassword({ email, password });
          if (reAuth?.user) user = reAuth.user;
        }
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials. Check email and password.' },
          { status: 401 }
        );
      }
    }

    // Retrieve user profile to determine role
    let { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      // Auto-provision demo profiles
      const orgId = '00000000-0000-0000-0000-000000000001';
      const isOfficer = email.toLowerCase().includes('officer');
      const isPayroll = email.toLowerCase().includes('payroll');

      const role = isOfficer ? 'officer' : 'employee';

      await supabase.from('profiles').upsert({
        user_id: user.id,
        organization_id: orgId,
        role,
      });

      if (!isOfficer) {
        const deptId = isPayroll
          ? '11111111-1111-1111-1111-111111111111'
          : '22222222-2222-2222-2222-222222222222';
        const displayName = isPayroll ? 'Alex Rivera' : 'Devon Vance';
        const jobRole = isPayroll ? 'Payroll Specialist' : 'Senior Staff Engineer';

        await supabase.from('employees').upsert({
          user_id: user.id,
          department_id: deptId,
          display_name: displayName,
          job_role: jobRole,
        }, { onConflict: 'user_id' });
      }

      const { data: refetched } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single();
      profile = refetched;
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not configured. Contact security administrator.' },
        { status: 403 }
      );
    }

    // PRD constraint: Never return tokens or keys in JSON response!
    // Cookie session is already attached by @supabase/ssr setAll.
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        organization_id: profile.organization_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal authentication error' },
      { status: 500 }
    );
  }
}
