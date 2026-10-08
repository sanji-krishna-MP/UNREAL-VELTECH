'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';
import {
  Send,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authRes.ok || !authData.authenticated || authData.user.role !== 'officer') {
        router.push('/login');
        return;
      }
      setUser(authData.user);

      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load campaign');

      setCampaign(data.campaign);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) fetchCampaign();
  }, [campaignId]);

  const handleLaunch = async () => {
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Launch failed');

      await fetchCampaign();
    } catch (e: any) {
      setError(e.message || 'Error launching campaign');
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#8B8B95]">
        Loading campaign simulation...
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={fetchCampaign}
        className="gap-1.5 text-xs text-zinc-300 hover:text-white"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Refresh</span>
      </Button>

      {campaign?.status === 'draft' && (
        <Button
          size="sm"
          onClick={handleLaunch}
          disabled={launching}
          className="gap-1.5 text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{launching ? 'Deploying...' : 'Launch Simulation'}</span>
        </Button>
      )}
    </div>
  );

  return (
    <AppShell
      user={user}
      title="Campaign Inspector"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Campaigns' },
        { label: campaign?.title ? campaign.title.slice(0, 24) + '...' : 'Inspector' },
      ]}
      actions={headerActions}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {campaign && (
          <>
            {/* Header / Summary Card */}
            <div className="rounded-lg bg-[#111113] border border-[#28282D] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                        campaign.status === 'launched'
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                          : 'bg-amber-950/40 text-amber-300 border-amber-800/80'
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-xs font-mono text-zinc-300 bg-[#1B1B1F] border border-[#28282D] px-2 py-0.5 rounded">
                      {campaign.scenario}
                    </span>
                    <span className="text-xs text-[#8B8B95] capitalize">
                      {campaign.default_difficulty} difficulty
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                    {campaign.title}
                  </h1>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#28282D] text-xs">
                <div>
                  <span className="text-[#8B8B95]">Target Department</span>
                  <p className="font-medium text-zinc-200 mt-0.5">
                    {campaign.target_department?.name || 'All Organization Cohorts'}
                  </p>
                </div>

                <div>
                  <span className="text-[#8B8B95]">Response Deadline</span>
                  <p className="font-mono text-zinc-300 mt-0.5 tabular-nums">
                    {new Date(campaign.response_deadline).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="text-[#8B8B95]">Generation Mode</span>
                  <p className="font-mono text-zinc-300 mt-0.5">
                    {campaign.generation_mode || 'Template mode'}
                  </p>
                </div>

                <div>
                  <span className="text-[#8B8B95]">Total Deliveries</span>
                  <p className="font-mono text-zinc-100 mt-0.5 font-bold tabular-nums">
                    {campaign.deliveries?.length || 0} recipients
                  </p>
                </div>
              </div>
            </div>

            {/* Recipient Outcomes Table */}
            <div className="rounded-lg bg-[#111113] border border-[#28282D] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Recipient Deliveries & Telemetry Outcomes
                  </h2>
                  <p className="text-xs text-[#8B8B95] mt-0.5">
                    Observed response state for individual simulation participants.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#8B8B95]">
                  {campaign.deliveries?.length || 0} deliveries evaluated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#28282D] text-[#8B8B95] font-medium">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Department & Role</th>
                      <th className="py-2.5 px-3">Simulation Outcome</th>
                      <th className="py-2.5 px-3">Assigned Remediation</th>
                      <th className="py-2.5 px-3 text-right">Event Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#28282D]/70">
                    {!campaign.deliveries || campaign.deliveries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#8B8B95]">
                          {campaign.status === 'draft'
                            ? 'Campaign is in draft state. Launch simulation to deploy deliveries to target cohort.'
                            : 'No deliveries recorded for this cohort.'}
                        </td>
                      </tr>
                    ) : (
                      campaign.deliveries.map((del: any) => {
                        const events = del.events || [];
                        const hasClicked = events.some((e: any) => e.type === 'clicked');
                        const hasReported = events.some((e: any) => e.type === 'reported');
                        const hasOpened = events.some((e: any) => e.type === 'opened');
                        const assignment = del.assignments?.[0];

                        let statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-[#1B1B1F] text-[#8B8B95] border-[#28282D]">
                            Pending Interaction
                          </span>
                        );

                        if (hasClicked) {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-red-950/40 text-red-300 border-red-800/80">
                              Simulated Click Recorded
                            </span>
                          );
                        } else if (hasReported) {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-950/40 text-emerald-300 border-emerald-800/80">
                              Reported Phishing Threat
                            </span>
                          );
                        } else if (hasOpened) {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-[#1B1B1F] text-zinc-300 border-[#28282D]">
                              Opened Message
                            </span>
                          );
                        }

                        return (
                          <tr key={del.id} className="hover:bg-[#1B1B1F]/40 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-medium text-zinc-200">
                                {del.employee?.display_name || 'Anonymous Employee'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#8B8B95]">
                              {del.employee?.department?.name || 'Staff'} · {del.employee?.job_role || 'Employee'}
                            </td>
                            <td className="py-3 px-3">{statusBadge}</td>
                            <td className="py-3 px-3">
                              {assignment ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                    assignment.status === 'completed'
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                                      : 'bg-amber-950/40 text-amber-300 border-amber-800/80'
                                  }`}
                                >
                                  {assignment.status === 'completed'
                                    ? 'Training Completed'
                                    : 'Training In Progress'}
                                </span>
                              ) : (
                                <span className="text-[#8B8B95] text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[11px] text-[#8B8B95] tabular-nums">
                              {new Date(del.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function CampaignDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#8B8B95]">
          Loading campaign inspector...
        </div>
      }
    >
      <CampaignDetailContent />
    </React.Suspense>
  );
}
