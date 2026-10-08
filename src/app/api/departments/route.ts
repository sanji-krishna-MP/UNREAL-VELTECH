import { NextResponse } from 'next/server';
import { requireOfficer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireOfficer();
    const supabase = await createClient();

    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        employees(
          id,
          display_name,
          job_role
        )
      `)
      .eq('organization_id', session.profile.organization_id)
      .order('name');

    if (error) {
      console.error('Fetch departments error:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ departments: departments || [] });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
