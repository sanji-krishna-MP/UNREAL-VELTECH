import { NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireEmployee();
    const employeeId = session.employee!.id;
    const supabase = await createClient();

    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(`
        id,
        subject,
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
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch employee inbox error:', error);
      return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 });
    }

    const filteredDeliveries = (deliveries || []).filter(
      (d: any) => !d.campaign?.title?.startsWith('Live Verification Simulation')
    );

    return NextResponse.json({ deliveries: filteredDeliveries });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
