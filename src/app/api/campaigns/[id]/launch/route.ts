import { NextResponse } from 'next/server';
import { requireOfficer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireOfficer();
    const { id: campaignId } = await params;
    const supabase = await createClient();

    // 1. Try invoking the database RPC if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_launch_campaign', {
      p_campaign_id: campaignId,
      p_user_id: session.user.id,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData);
    }

    // 2. Direct transactional fallback using session/admin client
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*, target_department:departments(*)')
      .eq('id', campaignId)
      .eq('organization_id', session.profile.organization_id)
      .single();

    if (campError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'launched') {
      const { count } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      return NextResponse.json({
        success: true,
        status: 'already_launched',
        deliveries_count: count || 0,
      });
    }

    // Query target employees
    let empQuery = supabase
      .from('employees')
      .select('id, display_name, job_role, department:departments!inner(id, name, organization_id)')
      .eq('department.organization_id', session.profile.organization_id);

    if (campaign.target_department_id) {
      empQuery = empQuery.eq('department_id', campaign.target_department_id);
    }

    const { data: employees, error: empError } = await empQuery;

    if (empError || !employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'No target employees found in this cohort.' },
        { status: 400 }
      );
    }

    const variants = (campaign.variants as any[]) || [];
    let deliveredCount = 0;

    for (const emp of employees) {
      // Find matching variant
      let matched = variants.find(
        (v) =>
          v.department_name?.toLowerCase().includes((emp.department as any)?.name?.toLowerCase()) ||
          v.job_role?.toLowerCase().includes(emp.job_role?.toLowerCase())
      );
      if (!matched && variants.length > 0) {
        matched = variants[0];
      }

      let subject = matched?.subject;
      let body = matched?.body;
      let adaptationReason = matched?.adaptation_reason;

      if (!subject || !body) {
        const isPayroll = (emp.department as any)?.name?.toLowerCase().includes('payroll');
        if (isPayroll) {
          subject = 'URGENT: Verify Updated Direct Deposit Account Details';
          body = `Hello ${emp.display_name},\n\nA pending change request was submitted to update your primary direct deposit banking routing number for upcoming payroll distribution. If you did not authorize this adjustment, confirm your payroll identity immediately.\n\nPlease click the button below to review your deposit configuration.`;
          adaptationReason = 'Role-targeted payroll banking diversion simulation.';
        } else {
          subject = 'ACTION REQUIRED: Security Audit - Verify Engineering SSH Key & Repo Permissions';
          body = `Hello ${emp.display_name},\n\nOur automated security scanning system detected an unverified SSH public key authorization request across internal repositories. To prevent repository commit revocation, review your registered credentials within the next 24 hours.\n\nPlease click the button below to verify your access.`;
          adaptationReason = 'Role-targeted repository credential verification simulation.';
        }
      }

      const { error: insErr } = await supabase
        .from('deliveries')
        .upsert(
          {
            campaign_id: campaignId,
            employee_id: emp.id,
            subject,
            body,
            difficulty: campaign.default_difficulty,
            adaptation_reason: adaptationReason,
          },
          { onConflict: 'campaign_id,employee_id', ignoreDuplicates: true }
        );

      if (!insErr) deliveredCount++;
    }

    // Freeze campaign and mark launched
    await supabase
      .from('campaigns')
      .update({
        status: 'launched',
        launched_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      status: 'launched',
      deliveries_count: deliveredCount,
    });
  } catch (error: any) {
    console.error('Launch campaign error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to launch campaign' }, { status: 500 });
  }
}
