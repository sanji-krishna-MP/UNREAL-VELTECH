'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function DeliveryDetailContent() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = (params?.deliveryId || params?.id) as string;

  const [user, setUser] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation Alert Modal / Banner State
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

      // Reveal immediate simulation awareness alert
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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#8B8B95]">
        Loading message...
      </div>
    );
  }

  const events = delivery?.events || [];
  const hasClicked = events.some((e: any) => e.type === 'clicked');
  const hasReported = events.some((e: any) => e.type === 'reported');
  const assignment = delivery?.assignments?.[0];

  const scenario = delivery?.campaign?.scenario?.toLowerCase() || '';
  const isPayroll = scenario.includes('payroll');

  const ctaButtonText = isPayroll
    ? 'Review Direct Deposit Account Details'
    : 'Verify Engineering SSH Key & Repo Permissions';

  return (
    <AppShell
      user={user}
      title="Message Preview"
      breadcrumbs={[
        { label: 'My Inbox', href: '/inbox' },
        { label: delivery?.subject ? delivery.subject.slice(0, 30) + '...' : 'Message' },
      ]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {reportFeedback && (
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-emerald-200">
                Threat Successfully Flagged
              </span>
              <p className="mt-0.5 text-zinc-300">{reportFeedback}</p>
            </div>
          </div>
        )}

        {/* Controlled Simulation Awareness Callout if Clicked */}
        {(simulationAlert.visible || hasClicked) && (
          <div className="p-5 rounded-lg bg-[#141416] border border-[#28282D] text-xs space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Security Notice: Controlled Simulation Exercise
            </div>
            <p className="text-zinc-300 leading-relaxed">
              You selected a simulated spear-phishing test link. In an actual cyber incident,
              this action could compromise credentials or sensitive organizational assets.
              To reinforce resilience, a short 3-question micro-training lesson has been assigned to your profile.
            </p>
            <div className="pt-1">
              <Button asChild size="sm" className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium">
                <Link href={`/training/${simulationAlert.assignmentId || assignment?.id}`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  Launch Assigned Micro-Training &rarr;
                </Link>
              </Button>
            </div>
          </div>
        )}

        {delivery && (
          <div className="rounded-lg bg-[#111113] border border-[#28282D] overflow-hidden">
            {/* Email Header Chrome */}
            <div className="p-6 bg-[#141416] border-b border-[#28282D] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
                  {delivery.subject}
                </h1>
                <div className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    disabled={actionLoading || hasReported}
                    className="gap-1.5 text-xs text-zinc-300 hover:text-white"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span>{hasReported ? 'Reported as Threat' : 'Report Phishing'}</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-[#28282D] text-[#8B8B95]">
                <div className="flex items-center gap-2">
                  <span>From:</span>
                  <span className="text-zinc-300 font-mono">
                    Enterprise Portal &lt;notifications-verify@internal-dispatch.portal&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span>Recipient:</span>
                  <span className="text-zinc-200 font-medium">
                    {delivery.employee?.display_name || user?.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body: Rendered as Plain Text */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap select-text bg-[#09090B] p-5 rounded border border-[#28282D]">
                {delivery.body}
              </div>

              {/* Controlled Action CTA Button */}
              <div className="pt-4 border-t border-[#28282D] flex flex-col items-center justify-center p-6 bg-[#141416] rounded-md border border-[#28282D] text-center space-y-3">
                <p className="text-xs text-[#8B8B95]">
                  Select the requested verification action to process your employee request:
                </p>

                <Button
                  type="button"
                  onClick={handleSimulatedClick}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold uppercase tracking-wider gap-2 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{ctaButtonText}</span>
                </Button>

                <span className="text-[10px] text-[#8B8B95] font-mono">
                  Official Internal Gateway Action • Controlled Verification Link
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DeliveryDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#8B8B95]">
          Loading message...
        </div>
      }
    >
      <DeliveryDetailContent />
    </React.Suspense>
  );
}
