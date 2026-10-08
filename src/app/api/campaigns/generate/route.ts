import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOfficer } from '@/lib/auth';
import { generateCampaignContent } from '@/lib/gemini';
import { getAdaptedRecommendation } from '@/lib/adaptation';
import { createClient } from '@/lib/supabase/server';

const generateSchema = z.object({
  department: z.string().min(1),
  scenario: z.string().min(1),
  difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
  targetDepartmentId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireOfficer();
    const body = await request.json();
    const parseResult = generateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid generation parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { department, scenario, difficulty, targetDepartmentId } = parseResult.data;
    const supabase = await createClient();

    // Query past deliveries and training state for target cohort to generate adaptation
    let hasClickedPrevious = false;
    let hasCompletedTraining = false;

    if (targetDepartmentId) {
      const { data: pastDeliveries } = await supabase
        .from('deliveries')
        .select(`
          id,
          created_at,
          campaign:campaigns(scenario),
          employee:employees!inner(department_id),
          events:engagement_events(type),
          assignments:training_assignments(status)
        `)
        .eq('employee.department_id', targetDepartmentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (pastDeliveries && pastDeliveries.length > 0) {
        for (const del of pastDeliveries) {
          const clicked = del.events?.some((e: any) => e.type === 'clicked');
          if (clicked) {
            hasClickedPrevious = true;
            const completed = del.assignments?.some((a: any) => a.status === 'completed');
            if (completed) hasCompletedTraining = true;
            break;
          }
        }
      }
    }

    const adaptation = getAdaptedRecommendation(scenario, {
      hasClickedPrevious,
      previousScenario: scenario,
      hasCompletedTraining,
    });

    const generation = await generateCampaignContent({
      department,
      scenario,
      difficulty,
      adaptationReason: adaptation.explanation,
    });

    return NextResponse.json({
      success: true,
      variant: generation.variant,
      generationMode: generation.generationMode,
      modelUsed: generation.modelUsed,
      durationMs: generation.durationMs,
      adaptationExplanation: adaptation.explanation,
      suggestedDifficulty: adaptation.suggestedDifficulty,
    });
  } catch (error: any) {
    console.error('Campaign generation error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to generate campaign content' }, { status: 500 });
  }
}
