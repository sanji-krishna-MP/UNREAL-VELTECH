import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOfficer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const createCampaignSchema = z.object({
  title: z.string().min(1),
  scenario: z.string().min(1),
  target_department_id: z.string().uuid().nullable().optional(),
  default_difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
  response_deadline: z.string().datetime(),
  generation_mode: z.string().default('Template mode'),
  variants: z.array(
    z.object({
      job_role: z.string(),
      department_name: z.string(),
      subject: z.string(),
      body: z.string(),
      adaptation_reason: z.string().optional(),
    })
  ),
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

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        organization_id: session.profile.organization_id,
        created_by: session.user.id,
        title: data.title,
        scenario: data.scenario,
        target_department_id: data.target_department_id || null,
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
