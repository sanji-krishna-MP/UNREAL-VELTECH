import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOfficer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const createCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  scenario: z.string().min(1, 'Scenario is required'),
  target_department_id: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== '' && v !== 'null' && v !== 'undefined' ? v.trim() : null)),
  default_difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
  response_deadline: z.string().transform((v) => {
    const d = new Date(v);
    return isNaN(d.getTime())
      ? new Date(Date.now() + 7 * 86400000).toISOString()
      : d.toISOString();
  }),
  generation_mode: z.string().default('Template mode'),
  variants: z
    .array(
      z.object({
        job_role: z.string().optional().default('Employee'),
        department_name: z.string().optional().default('General'),
        subject: z.string().min(1, 'Subject is required'),
        body: z.string().min(1, 'Body is required'),
        adaptation_reason: z.string().nullable().optional(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  try {
    const session = await requireOfficer();
    const body = await request.json();
    const parseResult = createCampaignSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid campaign payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const supabase = await createClient();

    let resolvedDeptId: string | null = null;
    if (data.target_department_id) {
      if (/^[0-9a-fA-F-]{36}$/.test(data.target_department_id)) {
        resolvedDeptId = data.target_department_id;
      } else {
        const { data: deptMatch } = await supabase
          .from('departments')
          .select('id')
          .eq('organization_id', session.profile.organization_id)
          .ilike('name', `%${data.target_department_id}%`)
          .limit(1)
          .maybeSingle();
        resolvedDeptId = deptMatch?.id || null;
      }
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        organization_id: session.profile.organization_id,
        created_by: session.user.id,
        title: data.title,
        scenario: data.scenario,
        target_department_id: resolvedDeptId,
        default_difficulty: data.default_difficulty,
        status: 'draft',
        response_deadline: data.response_deadline,
        generation_mode: data.generation_mode,
        variants: data.variants,
      })
      .select()
      .single();

    if (error) {
      console.error('Create campaign draft error:', error);
      return NextResponse.json({ error: 'Failed to create campaign draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await requireOfficer();
    const supabase = await createClient();

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        target_department:departments(name),
        deliveries(
          id,
          events:engagement_events(type),
          assignments:training_assignments(status)
        )
      `)
      .eq('organization_id', session.profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List campaigns error:', error);
      return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
