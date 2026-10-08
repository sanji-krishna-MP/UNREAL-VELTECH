import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOfficer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const updateDraftSchema = z.object({
  title: z.string().optional(),
  scenario: z.string().optional(),
  target_department_id: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== '' && v !== 'null' && v !== 'undefined' ? v.trim() : null)),
  default_difficulty: z.enum(['introductory', 'intermediate', 'advanced']).optional(),
  response_deadline: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    }),
  variants: z
    .array(
      z.object({
        job_role: z.string().optional(),
        department_name: z.string().optional(),
        subject: z.string().min(1),
        body: z.string().min(1),
        adaptation_reason: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireOfficer();
    const { id } = await params;
    const supabase = await createClient();

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        target_department:departments(name),
        deliveries(
          id,
          subject,
          difficulty,
          adaptation_reason,
          created_at,
          employee:employees(
            id,
            display_name,
            job_role,
            department:departments(name)
          ),
          events:engagement_events(type, occurred_at),
          assignments:training_assignments(
            id,
            status,
            assigned_at,
            completed_at,
            module:training_modules(title, scenario)
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', session.profile.organization_id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireOfficer();
    const { id } = await params;
    const body = await request.json();
    const parseResult = updateDraftSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid update payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify campaign is in draft status
    const { data: existing, error: fetchErr } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('organization_id', session.profile.organization_id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot edit launched campaigns. Create a new draft.' },
        { status: 400 }
      );
    }

    const updateData: any = { ...parseResult.data };
    if (updateData.target_department_id !== undefined) {
      if (!updateData.target_department_id) {
        updateData.target_department_id = null;
      } else if (!/^[0-9a-fA-F-]{36}$/.test(updateData.target_department_id)) {
        const { data: deptMatch } = await supabase
          .from('departments')
          .select('id')
          .eq('organization_id', session.profile.organization_id)
          .ilike('name', `%${updateData.target_department_id}%`)
          .limit(1)
          .maybeSingle();
        updateData.target_department_id = deptMatch?.id || null;
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Update campaign draft error:', updateErr);
      return NextResponse.json({ error: 'Failed to update campaign draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
