import { NextResponse } from 'next/server';
import { requireOfficer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { calculateHviMetrics, ScorableDelivery } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireOfficer();
    const supabase = await createClient();
    const orgId = session.profile.organization_id;

    // 1. Fetch all launched campaigns for this organization
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        scenario,
        status,
        default_difficulty,
        response_deadline,
        created_at,
        launched_at,
        deliveries(id)
      `)
      .eq('organization_id', orgId)
      .not('title', 'ilike', 'Live Verification Simulation%')
      .order('created_at', { ascending: false });

    if (campErr) {
      console.error('Fetch dashboard campaigns error:', campErr);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    const launchedCampaignIds = (campaigns || [])
      .filter((c) => c.status === 'launched')
      .map((c) => c.id);

    // 2. Fetch all deliveries for launched campaigns
    let deliveriesData: any[] = [];
    if (launchedCampaignIds.length > 0) {
      const { data: dels, error: delErr } = await supabase
        .from('deliveries')
        .select(`
          id,
          campaign_id,
          employee_id,
          subject,
          difficulty,
          created_at,
          campaign:campaigns(
            id,
            title,
            scenario,
            response_deadline
          ),
          employee:employees(
            id,
            display_name,
            job_role,
            department:departments(id, name)
          ),
          events:engagement_events(
            type,
            occurred_at
          ),
          assignments:training_assignments(
            id,
            status,
            completed_at
          )
        `)
        .in('campaign_id', launchedCampaignIds);

      if (delErr) {
        console.error('Fetch dashboard deliveries error:', delErr);
        return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
      }

      deliveriesData = dels || [];
    }

    // 3. Transform deliveries into scorable items for HVI engine
    const scorableDeliveries: ScorableDelivery[] = deliveriesData.map((d) => {
      const events = d.events || [];
      const hasClick = events.some((e: any) => e.type === 'clicked');
      const hasReport = events.some((e: any) => e.type === 'reported');
      const hasOpen = events.some((e: any) => e.type === 'opened');

      return {
        id: d.id,
        response_deadline: d.campaign?.response_deadline || new Date().toISOString(),
        hasClick,
        hasReport,
        hasOpen,
      };
    });

    // 4. Calculate total training statistics across org
    let totalAssignments = 0;
    let completedAssignments = 0;

    for (const d of deliveriesData) {
      const assignments = d.assignments || [];
      for (const a of assignments) {
        totalAssignments++;
        if (a.status === 'completed') {
          completedAssignments++;
        }
      }
    }

    // 5. Compute real PRD-derived metrics
    const metrics = calculateHviMetrics(scorableDeliveries, {
      totalAssignments,
      completedAssignments,
    });

    // 6. Department breakdown
    const deptMap: Record<
      string,
      {
        name: string;
        deliveries: ScorableDelivery[];
        totalAssignments: number;
        completedAssignments: number;
      }
    > = {};

    for (const d of deliveriesData) {
      const deptName = d.employee?.department?.name || 'Unassigned';
      if (!deptMap[deptName]) {
        deptMap[deptName] = {
          name: deptName,
          deliveries: [],
          totalAssignments: 0,
          completedAssignments: 0,
        };
      }

      const events = d.events || [];
      const hasClick = events.some((e: any) => e.type === 'clicked');
      const hasReport = events.some((e: any) => e.type === 'reported');
      const hasOpen = events.some((e: any) => e.type === 'opened');

      deptMap[deptName].deliveries.push({
        id: d.id,
        response_deadline: d.campaign?.response_deadline || new Date().toISOString(),
        hasClick,
        hasReport,
        hasOpen,
      });

      for (const a of d.assignments || []) {
        deptMap[deptName].totalAssignments++;
        if (a.status === 'completed') {
          deptMap[deptName].completedAssignments++;
        }
      }
    }

    const departmentStats = Object.values(deptMap).map((d) => {
      const deptMetrics = calculateHviMetrics(d.deliveries, {
        totalAssignments: d.totalAssignments,
        completedAssignments: d.completedAssignments,
      });

      return {
        name: d.name,
        hvi: deptMetrics.hvi,
        hviLabel: deptMetrics.hviLabel,
        launchedCount: deptMetrics.launchedCount,
        eligibleCount: deptMetrics.eligibleCount,
        clickedCount: deptMetrics.clickedCount,
        reportedCount: deptMetrics.reportedCount,
        clickRate: deptMetrics.clickRate,
        reportRate: deptMetrics.reportRate,
        coverageRate: deptMetrics.responseCoverage,
        trainingCompletionRate: deptMetrics.trainingCompletionRate,
      };
    });

    return NextResponse.json({
      success: true,
      metrics,
      campaigns: campaigns || [],
      departmentStats,
      recentDeliveries: deliveriesData.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Dashboard aggregation error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to compute dashboard analytics' }, { status: 500 });
  }
}
