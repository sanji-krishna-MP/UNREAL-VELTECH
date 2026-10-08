'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Award,
} from 'lucide-react';

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
      if (!res.ok) throw new Error(data.error || 'Failed to load micro-training assignment');

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
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = assignment?.module?.questions || [];

    // Ensure all questions answered
    for (const q of questions) {
      if (selectedAnswers[q.id] === undefined) {
        setError(`Please answer question "${q.question}" before submitting.`);
        return;
      }
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
      if (!res.ok) throw new Error(data.error || 'Quiz evaluation failed');

      setSubmissionResult(data);
      if (data.passed) {
        // Refresh assignment state
        await fetchAssignment();
      }
    } catch (e: any) {
      setError(e.message || 'Error submitting answers');
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading interactive micro-training...
      </div>
    );
  }

  const module = assignment?.module;
  const isCompleted = assignment?.status === 'completed';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Inbox
          </Link>

          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${
              isCompleted
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
            }`}
          >
            {isCompleted ? 'VERIFIED COMPLETED' : 'TRAINING PENDING'}
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Completion Success Banner */}
        {isCompleted && (
          <div className="p-5 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/80 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/50">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Micro-Training Completed!</h2>
                <p className="text-xs text-slate-300 mt-1">
                  You scored 3/3 and successfully mastered this attack vector. Your completion has been persisted and synced with the security officer console.
                </p>
              </div>
            </div>
            <Link
              href="/inbox"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-colors text-center"
            >
              Back to Inbox
            </Link>
          </div>
        )}

        {module && (
          <div className="space-y-6">
            {/* 1. Micro-Lesson Section */}
            <div className="cyber-card rounded-xl p-6 sm:p-8 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                Scenario Micro-Lesson
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {module.title}
              </h1>

              <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed border-t border-slate-800/80 pt-4">
                {module.lesson.split('\n\n').map((paragraph: string, idx: number) => {
                  if (paragraph.startsWith('# ')) {
                    return null; // Skip main title as already displayed
                  }
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-sm font-bold text-white pt-2">
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  return <p key={idx}>{paragraph}</p>;
                })}
              </div>
            </div>

            {/* 2. Interactive 3-Question Quiz */}
            <div className="cyber-card rounded-xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white text-sm font-bold">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Comprehension Check (3 Questions)
                </div>
                <span className="text-[11px] text-slate-400">Score 3/3 required to pass</span>
              </div>

              <form onSubmit={handleSubmitQuiz} className="space-y-6">
                {(module.questions || []).map((q: any, qIdx: number) => {
                  const feedback = submissionResult?.feedback?.[q.id];
                  const hasAnswered = selectedAnswers[q.id] !== undefined;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          <span className="text-cyan-400 font-mono mr-1.5">{qIdx + 1}.</span>
                          {q.question}
                        </h4>

                        {feedback && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 flex items-center gap-1 border ${
                              feedback.isCorrect
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                : 'bg-red-950/60 text-red-300 border-red-800'
                            }`}
                          >
                            {feedback.isCorrect ? (
                              <>
                                <Check className="w-3 h-3" /> Correct
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" /> Incorrect
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={isSelected}
                                onChange={() => handleSelectOption(q.id, optIdx)}
                                disabled={isCompleted}
                                className="mt-0.5 accent-cyan-400 shrink-0"
                              />
                              <span className="leading-relaxed">{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Explanation if failed */}
                      {feedback && !feedback.isCorrect && (
                        <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-[11px] text-red-300 space-y-1">
                          <span className="font-semibold block">Explanation:</span>
                          <p className="text-slate-300">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submission Actions */}
                {!isCompleted && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
                    <div>
                      {submissionResult && !submissionResult.passed && (
                        <p className="text-xs text-red-400 font-medium">
                          You scored {submissionResult.score} / {submissionResult.totalQuestions}.
                          Please review the explanations above and retry.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      {submissionResult && !submissionResult.passed && (
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Retry Quiz
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Grading on Server...' : 'Submit Answers for Verification'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MicroTrainingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading interactive micro-training...
        </div>
      }
    >
      <MicroTrainingContent />
    </React.Suspense>
  );
}

