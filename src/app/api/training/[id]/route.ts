import { NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee();
    const { id: assignmentId } = await params;
    const supabase = await createClient();

    const { data: assignment, error } = await supabase
      .from('training_assignments')
      .select(`
        id,
        delivery_id,
        module_id,
        status,
        assigned_at,
        completed_at,
        delivery:deliveries!inner(
          id,
          employee_id,
          subject,
          difficulty
        ),
        module:training_modules!inner(
          id,
          scenario,
          title,
          lesson,
          questions
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: 'Training assignment not found' }, { status: 404 });
    }

    // Enforce ownership
    if ((assignment.delivery as any).employee_id !== session.employee!.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this training assignment' },
        { status: 403 }
      );
    }

    // Fetch attempts
    const { data: attempts } = await supabase
      .from('training_attempts')
      .select('id, score, passed, created_at')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        completed_at: assignment.completed_at,
        delivery: assignment.delivery,
        module: assignment.module,
        attempts: attempts || [],
      },
    });
  } catch (error: any) {
    console.error('Fetch training assignment error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
