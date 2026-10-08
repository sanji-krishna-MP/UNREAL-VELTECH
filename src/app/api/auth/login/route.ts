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

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials. Check email and password.' },
        { status: 401 }
      );
    }

    // Retrieve user profile to determine role
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', authData.user.id)
      .single();

    if (profError || !profile) {
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
        id: authData.user.id,
        email: authData.user.email,
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
