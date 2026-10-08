import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireEmployee } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const eventSchema = z.object({
  type: z.enum(['opened', 'reported', 'clicked']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee();
    const { id: deliveryId } = await params;
    const body = await request.json();
    const parseResult = eventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid event type. Must be opened, reported, or clicked.' },
        { status: 400 }
      );
    }

    const { type } = parseResult.data;
    const supabase = await createClient();

    // Verify ownership
    const { data: delivery, error: delError } = await supabase
      .from('deliveries')
      .select('id, employee_id, campaign:campaigns(scenario)')
      .eq('id', deliveryId)
      .single();

    if (delError || !delivery) {
      return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
    }

    if (delivery.employee_id !== session.employee!.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this delivery record' },
        { status: 403 }
      );
    }

    // Handle 'clicked': Atomic failure record + training assignment
    if (type === 'clicked') {
      // 1. Try database RPC if exists
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'rpc_record_click_and_assign',
        {
          p_delivery_id: deliveryId,
          p_user_id: session.user.id,
        }
      );

      if (!rpcErr && rpcData?.assignment_id) {
        return NextResponse.json(rpcData);
      }

      // 2. Direct atomic sequence via admin/server client
      const adminClient = createAdminClient();

      // Record click event idempotently
      await adminClient
        .from('engagement_events')
        .upsert(
          {
            delivery_id: deliveryId,
            type: 'clicked',
            occurred_at: new Date().toISOString(),
          },
          { onConflict: 'delivery_id,type', ignoreDuplicates: true }
        );

      // Find matching training module by scenario
      const scenario = (delivery.campaign as any)?.scenario || 'payroll_direct_deposit';
      let { data: moduleData } = await adminClient
        .from('training_modules')
        .select('id')
        .eq('scenario', scenario)
        .maybeSingle();

      if (!moduleData) {
        // Fallback to first available module
        const { data: firstMod } = await adminClient
          .from('training_modules')
          .select('id')
          .limit(1)
          .single();
        moduleData = firstMod;
      }

      if (!moduleData) {
        return NextResponse.json(
          { error: 'No training modules found in the system.' },
          { status: 500 }
        );
      }

      // Upsert assignment idempotently
      let assignmentId: string;
      const { data: existingAssignment } = await adminClient
        .from('training_assignments')
        .select('id')
        .eq('delivery_id', deliveryId)
        .eq('module_id', moduleData.id)
        .maybeSingle();

      if (existingAssignment) {
        assignmentId = existingAssignment.id;
      } else {
        const { data: newAssignment, error: assignError } = await adminClient
          .from('training_assignments')
          .insert({
            delivery_id: deliveryId,
            module_id: moduleData.id,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (assignError || !newAssignment) {
          throw new Error('Failed to create training assignment: ' + assignError?.message);
        }
        assignmentId = newAssignment.id;
      }

      return NextResponse.json({
        success: true,
        type: 'clicked',
        assignment_id: assignmentId,
        module_id: moduleData.id,
        simulationAlert: true,
        message: 'This was a harmless authorized cyber defense simulation.',
      });
    }

    // Handle 'opened' and 'reported'
    const { error: eventError } = await supabase
      .from('engagement_events')
      .upsert(
        {
          delivery_id: deliveryId,
          type,
          occurred_at: new Date().toISOString(),
        },
        { onConflict: 'delivery_id,type', ignoreDuplicates: true }
      );

    if (eventError) {
      console.error(`Error recording ${type} event:`, eventError);
      return NextResponse.json({ error: `Failed to record ${type} event` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      type,
      delivery_id: deliveryId,
      message:
        type === 'reported'
          ? 'Threat reported successfully! Thank you for strengthening corporate security.'
          : 'Message opened.',
    });
  } catch (error: any) {
    console.error('Record engagement event error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
