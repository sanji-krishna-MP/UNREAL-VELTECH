'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function MicroTrainingContent() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [user, setUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz State: selected option index per question ID
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    totalQuestions: number;
    passed: boolean;
    feedback: Record<string, { isCorrect: boolean; submittedIndex: number }>;
  } | null>(null);

  const fetchAssignment = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authRes.ok || !authData.authenticated) {
        router.push('/login');
        return;
      }
      setUser(authData.user);

      const res = await fetch(`/api/training/${assignmentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load training assignment');

      setAssignment(data.assignment);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) fetchAssignment();
  }, [assignmentId]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (assignment?.status === 'completed' || submissionResult?.passed) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    const questions = assignment?.module?.questions || [];
    const unanswered = questions.some((q: any) => selectedAnswers[q.id] === undefined);

    if (unanswered) {
      setError('Please provide an answer for all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/training/${assignmentId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');

      setSubmissionResult(data);

      if (data.passed) {
        setAssignment((prev: any) => ({ ...prev, status: 'completed' }));
      }
    } catch (e: any) {
      setError(e.message || 'Error submitting assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmissionResult(null);
    setSelectedAnswers({});
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#8B8B95]">
        Loading micro-training module...
      </div>
    );
  }

  const module = assignment?.module;
  const questions = module?.questions || [];
  const isCompleted = assignment?.status === 'completed' || submissionResult?.passed;

  return (
    <AppShell
      user={user}
      title="Micro-Training"
      breadcrumbs={[
        { label: 'My Inbox', href: '/inbox' },
        { label: 'Remediation Training' },
      ]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Module Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                  isCompleted
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/80'
                }`}
              >
                {isCompleted ? 'Training Completed' : 'Training Pending'}
              </span>
              <span className="text-xs font-mono text-[#8B8B95]">
                {module?.scenario}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
              {module?.title || 'Phishing Awareness Micro-Lesson'}
            </h1>
          </div>

          <Button asChild variant="outline" size="sm" className="shrink-0 text-xs text-zinc-300 hover:text-white">
            <Link href="/inbox">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Inbox
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Micro-Lesson Educational Card */}
        <div className="rounded-lg bg-[#111113] border border-[#28282D] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#8B8B95] pb-3 border-b border-[#28282D]">
            <BookOpen className="w-4 h-4 text-zinc-300" />
            <span>Scenario Micro-Lesson</span>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
            {module?.lesson}
          </div>
        </div>

        {/* 2. Interactive Assessment Quiz */}
        <div className="rounded-lg bg-[#111113] border border-[#28282D] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#28282D]">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Comprehension Assessment (3 Questions)
              </h2>
              <p className="text-xs text-[#8B8B95] mt-0.5">
                Answer all 3 scenario questions correctly to fulfill your training assignment.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#8B8B95]">
              Score 3/3 required to pass
            </span>
          </div>

          {/* Feedback Banner if Submitted */}
          {submissionResult && (
            <div
              className={`p-4 rounded-md border text-xs flex items-start gap-3 ${
                submissionResult.passed
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/80 text-red-300'
              }`}
            >
              {submissionResult.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-semibold block">
                  {submissionResult.passed
                    ? 'Assessment Successfully Passed!'
                    : `Score: ${submissionResult.score} of ${submissionResult.totalQuestions} Correct`}
                </span>
                <p className="text-zinc-300">
                  {submissionResult.passed
                    ? 'Outstanding job! You demonstrated complete comprehension of the attack indicators. Your organizational compliance is updated.'
                    : '100% mastery is required to complete remediation. Review the explanations below and try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Questions Stack */}
          <div className="space-y-8">
            {questions.map((q: any, qIdx: number) => {
              const qId = q.id;
              const selectedIdx = selectedAnswers[qId];
              const feedback = submissionResult?.feedback?.[qId];

              return (
                <div key={qId} className="space-y-3 pt-4 first:pt-0 border-t first:border-t-0 border-[#28282D]">
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-[#1B1B1F] border border-[#28282D] text-[11px] font-mono text-zinc-300 shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <p className="text-sm font-medium text-zinc-100 leading-snug">
                      {q.question}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pl-7">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isSelected = selectedIdx === optIdx;
                      let optionBorder = isSelected ? 'border-zinc-300 bg-[#1B1B1F]' : 'border-[#28282D] bg-[#09090B]';

                      if (feedback) {
                        if (isSelected) {
                          optionBorder = feedback.isCorrect
                            ? 'border-emerald-600 bg-emerald-950/20 text-emerald-200'
                            : 'border-red-600 bg-red-950/20 text-red-200';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qId, optIdx)}
                          disabled={isCompleted}
                          className={`w-full text-left p-3 rounded-md border text-xs transition-colors flex items-start gap-3 disabled:cursor-default ${optionBorder} hover:bg-[#1B1B1F]/60`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                              isSelected
                                ? 'border-zinc-100 bg-zinc-100 text-zinc-900'
                                : 'border-[#28282D]'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                          </div>
                          <span className="text-zinc-200 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation feedback */}
                  {feedback && q.explanation && (
                    <div className="ml-7 p-3 rounded bg-[#141416] border border-[#28282D] text-[11px] text-[#8B8B95] space-y-0.5">
                      <span className="font-medium text-zinc-300 block">Explanation:</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#28282D] flex items-center justify-between">
            {submissionResult && !submissionResult.passed ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                className="gap-2 text-xs text-zinc-300 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Assessment
              </Button>
            ) : isCompleted ? (
              <Button asChild size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium">
                <Link href="/inbox">
                  Return to Corporate Inbox &rarr;
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="ml-auto bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium"
              >
                {submitting ? 'Evaluating Submission...' : 'Submit Assessment'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function MicroTrainingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#8B8B95]">
          Loading micro-training module...
        </div>
      }
    >
      <MicroTrainingContent />
    </React.Suspense>
  );
}
