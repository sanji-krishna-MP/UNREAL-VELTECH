import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireEmployee } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  answers: z.record(z.string(), z.number()), // e.g. { q1: 3, q2: 1, q3: 2 }
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee();
    const { id: assignmentId } = await params;
    const body = await request.json();
    const parseResult = submitSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      );
    }

    const { answers } = parseResult.data;
    const supabase = await createClient();

    // Verify assignment ownership
    const { data: assignment, error: assignErr } = await supabase
      .from('training_assignments')
      .select('id, module_id, status, delivery:deliveries!inner(employee_id)')
      .eq('id', assignmentId)
      .single();

    if (assignErr || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if ((assignment.delivery as any).employee_id !== session.employee!.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this assignment' },
        { status: 403 }
      );
    }

    // Retrieve server-held answer key using privileged admin client
    // Note: answer key is never accessible to client via standard RLS
    const adminClient = createAdminClient();
    const { data: keyRecord, error: keyErr } = await adminClient
      .from('training_answer_keys')
      .select('correct_answers')
      .eq('module_id', assignment.module_id)
      .single();

    if (keyErr || !keyRecord) {
      return NextResponse.json(
        { error: 'Answer key for this module is missing from server storage.' },
        { status: 500 }
      );
    }

    const correctAnswers = keyRecord.correct_answers as Record<string, number>;
    const questionKeys = Object.keys(correctAnswers);

    let score = 0;
    const feedback: Record<string, { isCorrect: boolean; submittedIndex: number }> = {};

    for (const qKey of questionKeys) {
      const submitted = answers[qKey];
      const correct = correctAnswers[qKey];
      const isCorrect = submitted !== undefined && Number(submitted) === Number(correct);

      if (isCorrect) score++;

      feedback[qKey] = {
        isCorrect,
        submittedIndex: submitted,
      };
    }

    // Pass requirement: all questions must be answered correctly (3 out of 3)
    const passed = score === questionKeys.length;

    // Record attempt
    await adminClient.from('training_attempts').insert({
      assignment_id: assignmentId,
      submitted_answers: answers,
      score,
      passed,
    });

    // If passed, mark assignment as completed
    if (passed) {
      await adminClient
        .from('training_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
    }

    return NextResponse.json({
      success: true,
      score,
      totalQuestions: questionKeys.length,
      passed,
      feedback,
      assignmentStatus: passed ? 'completed' : assignment.status,
    });
  } catch (error: any) {
    console.error('Submit quiz attempt error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to evaluate quiz submission' }, { status: 500 });
  }
}
