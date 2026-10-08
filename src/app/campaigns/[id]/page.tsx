'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldAlert,
  Clock,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading campaign simulation...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Console
          </Link>

          <button
            onClick={fetchCampaign}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {campaign && (
          <>
            {/* Header Box */}
            <div className="cyber-card rounded-xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        campaign.status === 'launched'
                          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
                          : 'bg-yellow-950/50 text-yellow-300 border-yellow-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {campaign.scenario}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      {campaign.default_difficulty} difficulty
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {campaign.title}
                  </h1>
                </div>

                {campaign.status === 'draft' && (
                  <button
                    onClick={handleLaunch}
                    disabled={launching}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-950 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {launching ? 'Deploying Deliveries...' : 'Launch Simulation Now'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 block">Target Cohort:</span>
                  <span className="text-white font-medium">
                    {campaign.target_department?.name || 'All Departments'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Response Deadline:</span>
                  <span className="text-white font-medium">
                    {new Date(campaign.response_deadline).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Generation Engine:</span>
                  <span className="text-cyan-300 font-medium">{campaign.generation_mode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deliveries Count:</span>
                  <span className="text-white font-mono font-bold">
                    {campaign.deliveries?.length || 0} employees
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient Deliveries Table */}
            <div className="cyber-card rounded-xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Cohort Simulation Outcomes
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {campaign.deliveries?.length || 0} Dispatched Deliveries
                </span>
              </div>

              {campaign.deliveries?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  {campaign.status === 'draft'
                    ? 'Campaign is currently in draft. Launch it to dispatch deliveries to employees.'
                    : 'No target deliveries recorded.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-3">Employee</th>
                        <th className="py-3 px-3">Role & Dept</th>
                        <th className="py-3 px-3">Subject Dispatched</th>
                        <th className="py-3 px-3">Observed Outcome</th>
                        <th className="py-3 px-3">Assigned Micro-Training</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {campaign.deliveries.map((del: any) => {
                        const events = del.events || [];
                        const hasClick = events.some((e: any) => e.type === 'clicked');
                        const hasReport = events.some((e: any) => e.type === 'reported');
                        const hasOpen = events.some((e: any) => e.type === 'opened');
                        const assignment = del.assignments?.[0];

                        return (
                          <tr key={del.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-3 font-semibold text-white">
                              {del.employee?.display_name || 'Staff Member'}
                            </td>
                            <td className="py-3.5 px-3 text-slate-300">
                              <div>{del.employee?.job_role}</div>
                              <span className="text-[10px] text-slate-500">
                                {del.employee?.department?.name}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate">
                              {del.subject}
                            </td>
                            <td className="py-3.5 px-3">
                              {hasClick ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 text-red-300 border border-red-800">
                                  CLICKED (100 PTS)
                                </span>
                              ) : hasReport ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                                  REPORTED (0 PTS)
                                </span>
                              ) : hasOpen ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-950/60 text-yellow-300 border border-yellow-800">
                                  OPENED ONLY (25 PTS)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                                  UNOPENED
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {assignment ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    assignment.status === 'completed'
                                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
                                      : 'bg-cyan-950/50 text-cyan-300 border-cyan-800'
                                  }`}
                                >
                                  {assignment.status === 'completed'
                                    ? 'COMPLETED'
                                    : 'PENDING COMPLETION'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading campaign simulation...
        </div>
      }
    >
      <CampaignDetailContent />
    </React.Suspense>
  );
}

