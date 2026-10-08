'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldAlert,
  Flag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Mail,
  User,
  Clock,
} from 'lucide-react';

function DeliveryDetailContent() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = (params?.deliveryId || params?.id) as string;

  const [user, setUser] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation Alert Modal State
  const [simulationAlert, setSimulationAlert] = useState<{
    visible: boolean;
    assignmentId?: string;
  }>({ visible: false });

  // Report Feedback
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const fetchDelivery = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authRes.ok || !authData.authenticated) {
        router.push('/login');
        return;
      }
      setUser(authData.user);

      const res = await fetch(`/api/deliveries/${deliveryId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load delivery');

      setDelivery(data.delivery);

      // Record 'opened' event once when previewing (idempotent mutation)
      await fetch(`/api/deliveries/${deliveryId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'opened' }),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryId) fetchDelivery();
  }, [deliveryId]);

  const handleReport = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reported' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record report');

      setReportFeedback(
        'Outstanding security hygiene! You correctly flagged this spear-phishing simulation. Zero risk points have been recorded.'
      );
      await fetchDelivery();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulatedClick = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clicked' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process click');

      // Reveal immediate simulation awareness alert!
      setSimulationAlert({
        visible: true,
        assignmentId: data.assignment_id,
      });

      await fetchDelivery();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading message...
      </div>
    );
  }

  const events = delivery?.events || [];
  const hasClicked = events.some((e: any) => e.type === 'clicked');
  const hasReported = events.some((e: any) => e.type === 'reported');
  const assignment = delivery?.assignments?.[0];

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
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              DELIVERY ID: {deliveryId.slice(0, 8)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {reportFeedback && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/60 text-xs text-emerald-300 flex items-start gap-3 shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-200">Simulation Successfully Defended</span>
              <p className="mt-0.5 text-slate-200">{reportFeedback}</p>
            </div>
          </div>
        )}

        {/* Active Simulation Alert Banner if already clicked */}
        {(simulationAlert.visible || hasClicked) && (
          <div className="p-5 rounded-xl bg-red-950/40 border-2 border-red-500/80 text-xs text-red-200 space-y-3 shadow-xl shadow-red-950/50">
            <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm">
              <ShieldAlert className="w-5 h-5" />
              Security Notice: This Was a Controlled Simulation
            </div>
            <p className="text-slate-300 leading-relaxed">
              You clicked a harmless simulated spear-phishing test link. In an actual cyber attack,
              this action could have compromised employee credentials or internal systems.
              To strengthen resilience, a short 3-question micro-training lesson has been assigned to your profile.
            </p>
            <div className="pt-2">
              <Link
                href={`/training/${simulationAlert.assignmentId || assignment?.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Launch Assigned Micro-Training &rarr;
              </Link>
            </div>
          </div>
        )}

        {delivery && (
          <div className="cyber-card rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Email Header Chrome */}
            <div className="p-5 sm:p-6 bg-slate-900/60 border-b border-slate-800/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {delivery.subject}
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReport}
                    disabled={actionLoading || hasReported}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Flag className="w-3.5 h-3.5 text-yellow-400" />
                    {hasReported ? 'Reported as Threat' : 'Report Phishing'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">From:</span>
                  <span className="text-slate-300 font-mono">
                    Enterprise Portal &lt;notifications-verify@internal-dispatch.portal&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="text-slate-500 font-medium">Recipient:</span>
                  <span className="text-slate-300 font-medium">
                    {delivery.employee?.display_name || user?.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body: Rendered as Plain Text */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap select-text bg-slate-900/30 p-5 rounded-lg border border-slate-800/60">
                {delivery.body}
              </div>

              {/* Controlled Action CTA Button */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-xl border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Select the requested verification action to process your employee request:
                </p>

                <button
                  type="button"
                  onClick={handleSimulatedClick}
                  disabled={actionLoading}
                  className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-lg shadow-cyan-950 disabled:opacity-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {delivery.campaign?.scenario?.includes('payroll')
                    ? 'Review Direct Deposit Account Ledger'
                    : 'Verify Developer SSH Key & Permissions'}
                </button>

                <span className="text-[10px] text-slate-500">
                  Official Internal Gateway Action • Controlled Verification Link
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DeliveryDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading message...
        </div>
      }
    >
      <DeliveryDetailContent />
    </React.Suspense>
  );
}
