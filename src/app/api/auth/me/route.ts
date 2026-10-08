import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.profile.role,
        organization_id: session.profile.organization_id,
        employee: session.employee || null,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
  }
}
