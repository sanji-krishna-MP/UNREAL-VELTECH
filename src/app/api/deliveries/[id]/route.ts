import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: delivery, error } = await supabase
      .from('deliveries')
      .select(`
        id,
        campaign_id,
        employee_id,
        subject,
        body,
        difficulty,
        adaptation_reason,
        created_at,
        campaign:campaigns(
          id,
          title,
          scenario,
          status,
          response_deadline
        ),
        employee:employees(
          id,
          display_name,
          job_role,
          department:departments(name)
        ),
        events:engagement_events(
          type,
          occurred_at
        ),
        assignments:training_assignments(
          id,
          status,
          assigned_at,
          completed_at,
          module:training_modules(id, scenario, title)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !delivery) {
      return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
    }

    // Enforce authorization:
    // If employee, MUST own the delivery
    if (session.profile.role === 'employee') {
      if (delivery.employee_id !== session.employee?.id) {
        return NextResponse.json({ error: 'Forbidden: Access denied to this delivery' }, { status: 403 });
      }
    }

    return NextResponse.json({ delivery });
  } catch (error: any) {
    console.error('Fetch delivery error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
