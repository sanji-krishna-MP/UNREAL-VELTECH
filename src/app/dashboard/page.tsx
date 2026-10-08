'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  RotateCcw,
  Plus,
  Info,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import { HviMetrics } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { OrganizationRiskChart } from '@/components/charts/OrganizationRiskChart';
import { DepartmentRiskChart } from '@/components/charts/DepartmentRiskChart';
import { SampleRiskBreakdown } from '@/components/charts/SampleRiskBreakdown';
import {
  PAYROLL_SAMPLE_SUMMARY,
  ENGINEERING_SAMPLE_SUMMARY,
  SAMPLE_DAILY_OUTCOMES,
} from '@/lib/sample-analytics';

export default function OfficerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<HviMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Deterministic sample daily cohorts for the department charts
  const payrollCohorts = SAMPLE_DAILY_OUTCOMES.filter((r) => r.department === 'Payroll');
  const engineeringCohorts = SAMPLE_DAILY_OUTCOMES.filter((r) => r.department === 'Engineering');

  const fetchDashboardData = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authRes.ok || !authData.authenticated) {
        router.push('/login');
        return;
      }

      if (authData.user.role !== 'officer') {
        router.push('/inbox');
        return;
      }

      setUser(authData.user);

      const dashRes = await fetch('/api/dashboard');
      const dashData = await dashRes.json();

      if (!dashRes.ok) {
        throw new Error(dashData.error || 'Failed to fetch dashboard telemetry');
      }

      setMetrics(dashData.metrics);
      setCampaigns(dashData.campaigns || []);
      setDepartmentStats(dashData.departmentStats || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const headerActions = (
    <div className="flex items-center gap-2.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualRefresh}
        disabled={refreshing}
        className="gap-1.5 text-xs text-zinc-300 hover:text-white"
      >
        <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
      </Button>

      <Button asChild size="sm" className="gap-1.5 text-xs font-medium">
        <Link href="/campaigns/new">
          <Plus className="w-3.5 h-3.5" />
          <span>New Simulation</span>
        </Link>
      </Button>
    </div>
  );

  return (
    <AppShell
      user={user}
      title="Security Overview"
      breadcrumbs={[{ label: 'Command Center' }, { label: 'Security Overview' }]}
      actions={headerActions}
    >
      <div className="space-y-9">
        {/* 1. Page Title & Context */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
            Human Vulnerability Console
          </h1>
          <p className="text-xs text-[#8B8B95]">
            Observed organizational phishing telemetry and adaptive defense resilience.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* 2. Top 4 LIVE KPI Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Human Vulnerability Index */}
          <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-[#8B8B95]">
                  Human Vulnerability Index
                </span>
                <p className="text-[11px] text-[#8B8B95]/80 mt-0.5">
                  Observed risk score (0–100)
                </p>
              </div>
              <button
                onClick={() => setShowFormulaModal(true)}
                aria-label="View PRD formula calculation"
                className="text-[#8B8B95] hover:text-zinc-200 transition-colors p-0.5"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-mono tabular-nums">
                {metrics?.hvi !== null && metrics?.hvi !== undefined ? metrics.hvi : '—'}
              </span>
              <span className="text-xs text-[#8B8B95]">
                {metrics?.hvi === null ? 'Insufficient data' : '/ 100 benchmark'}
              </span>
            </div>

            <div className="pt-2.5 border-t border-[#28282D] flex items-center justify-between text-[11px] text-[#8B8B95]">
              <span>Eligible deliveries:</span>
              <span className="font-mono text-zinc-300 tabular-nums">
                {metrics?.eligibleCount || 0}
              </span>
            </div>
          </div>

          {/* 2. Response Coverage */}
          <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#8B8B95]">
                Response Coverage
              </span>
              <p className="text-[11px] text-[#8B8B95]/80 mt-0.5">
                Interactions / launched
              </p>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-mono tabular-nums">
                {metrics?.responseCoverage !== null && metrics?.responseCoverage !== undefined
                  ? `${metrics.responseCoverage}%`
                  : '—'}
              </span>
            </div>

            <div className="pt-2.5 border-t border-[#28282D] flex items-center justify-between text-[11px] text-[#8B8B95]">
              <span>Participants:</span>
              <span className="font-mono text-zinc-300 tabular-nums">
                {metrics?.interactionCount || 0} of {metrics?.launchedCount || 0}
              </span>
            </div>
          </div>

          {/* 3. Click Failure Rate */}
          <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#8B8B95]">
                Click Failure Rate
              </span>
              <p className="text-[11px] text-[#8B8B95]/80 mt-0.5">
                Clicks / eligible
              </p>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-red-400 font-mono tabular-nums">
                {metrics?.clickRate !== null && metrics?.clickRate !== undefined
                  ? `${metrics.clickRate}%`
                  : '—'}
              </span>
            </div>

            <div className="pt-2.5 border-t border-[#28282D] flex items-center justify-between text-[11px] text-[#8B8B95]">
              <span>Failed actions:</span>
              <span className="font-mono text-red-400 tabular-nums">
                {metrics?.clickedCount || 0} clicks recorded
              </span>
            </div>
          </div>

          {/* 4. Micro-Training */}
          <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#8B8B95]">
                Micro-Training Remediation
              </span>
              <p className="text-[11px] text-[#8B8B95]/80 mt-0.5">
                Completed / assigned
              </p>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
                {metrics?.trainingCompletionRate !== null && metrics?.trainingCompletionRate !== undefined
                  ? `${metrics.trainingCompletionRate}%`
                  : '—'}
              </span>
            </div>

            <div className="pt-2.5 border-t border-[#28282D] flex items-center justify-between text-[11px] text-[#8B8B95]">
              <span>Remediated:</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                {metrics?.trainingCompletedCount || 0} of {metrics?.trainingTotalCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* PRD Formula Modal */}
        {showFormulaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-[#111113] rounded-lg max-w-lg w-full p-6 border border-[#28282D] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#28282D]">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-400" />
                  PRD Human Vulnerability Formula
                </h3>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="text-xs text-[#8B8B95] hover:text-white px-2 py-1 rounded bg-[#1B1B1F] border border-[#28282D]"
                >
                  Close
                </button>
              </div>

              <div className="text-xs text-zinc-300 space-y-3">
                <p>
                  A delivery represents one employee’s participation in one launched campaign.
                  Eligible deliveries have interacted OR passed the response deadline.
                </p>

                <div className="bg-[#09090B] rounded p-3 border border-[#28282D] space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-red-300">
                    <span>Any simulated link click:</span>
                    <span className="font-bold">100 risk pts</span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>Otherwise any report:</span>
                    <span className="font-bold">0 risk pts</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Otherwise opened only:</span>
                    <span className="font-bold">25 risk pts</span>
                  </div>
                  <div className="flex justify-between text-[#8B8B95]">
                    <span>Expired without interaction:</span>
                    <span className="font-bold">0 risk pts</span>
                  </div>
                </div>

                <p className="text-[#8B8B95] italic">
                  * Note: Unexpired untouched deliveries are excluded from the denominator.
                  Clicks take precedence over reports. Completed training does not erase historical failures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. RISK ANALYTICS PREVIEW SECTION */}
        <section className="space-y-6 pt-1">
          {/* Section Heading & Persistent Description */}
          <div className="space-y-1.5 pb-2 border-b border-[#28282D]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
                Risk analytics preview
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1B1B1F] text-zinc-300 border border-[#28282D]">
                Sample data
              </span>
            </div>
            <p className="text-xs text-[#8B8B95]">
              Illustrative sample data for Payroll and Engineering. These charts do not represent your live campaign results.
            </p>
          </div>

          {/* 4. Full-width Organization Risk Overview Chart */}
          <OrganizationRiskChart />

          {/* 5. Two Department Chart Panels (Side by side on desktop, stacked on mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentRiskChart
              department="Payroll"
              summary={PAYROLL_SAMPLE_SUMMARY}
              dailyCohorts={payrollCohorts}
              defaultView="trend"
            />
            <DepartmentRiskChart
              department="Engineering"
              summary={ENGINEERING_SAMPLE_SUMMARY}
              dailyCohorts={engineeringCohorts}
              defaultView="outcomes"
            />
          </div>

          {/* 6. Compact Sample Risk Breakdown and Interpretation */}
          <SampleRiskBreakdown />
        </section>

        {/* 7. LIVE DEPARTMENT RESULTS (Existing Live Department Profiles) */}
        <div className="rounded-lg bg-[#111113] border border-[#28282D] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Live department results
              </h2>
              <p className="text-xs text-[#8B8B95] mt-0.5">
                Aggregated live cohort breakdown across active corporate units from database.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#8B8B95] px-2 py-0.5 rounded bg-[#1B1B1F] border border-[#28282D]">
              Live Aggregates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {departmentStats.length === 0 ? (
              <p className="text-xs text-[#8B8B95] py-4">No department simulations evaluated yet.</p>
            ) : (
              departmentStats.map((dept) => (
                <div
                  key={dept.name}
                  className="bg-[#09090B] rounded-md p-4 border border-[#28282D] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-200 text-sm">{dept.name}</h3>
                      <p className="text-[11px] text-[#8B8B95]">
                        {dept.launchedCount} launched simulations
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8B8B95] uppercase font-mono">HVI Score</span>
                      <div className="text-base font-mono font-bold text-zinc-100 tabular-nums">
                        {dept.hvi !== null ? dept.hvi : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#28282D] text-xs">
                    <div>
                      <span className="text-[11px] text-[#8B8B95]">Coverage</span>
                      <p className="font-mono text-zinc-300 mt-0.5 tabular-nums">
                        {dept.coverageRate !== null ? `${dept.coverageRate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8B8B95]">Click Rate</span>
                      <p className="font-mono text-red-400 mt-0.5 tabular-nums">
                        {dept.clickRate !== null ? `${dept.clickRate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8B8B95]">Training</span>
                      <p className="font-mono text-emerald-400 mt-0.5 tabular-nums">
                        {dept.trainingCompletionRate !== null
                          ? `${dept.trainingCompletionRate}%`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 8. LIVE CAMPAIGNS TABLE */}
        <div className="rounded-lg bg-[#111113] border border-[#28282D] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Live campaigns
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B1B1F] text-zinc-400 border border-[#28282D]">
                  Database Telemetry
                </span>
              </div>
              <p className="text-xs text-[#8B8B95] mt-0.5">
                Active and completed mock phishing engagements.
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              New simulation &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#28282D] text-[#8B8B95] font-medium">
                  <th className="py-2.5 px-3">Campaign Title</th>
                  <th className="py-2.5 px-3">Scenario</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Deliveries</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#28282D]/70">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8B8B95]">
                      No active campaigns yet. Click &quot;New Simulation&quot; to configure your first campaign.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-[#1B1B1F]/40 transition-colors">
                      <td className="py-3 px-3">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          className="font-medium text-zinc-200 hover:underline"
                        >
                          {camp.title}
                        </Link>
                        <p className="text-[11px] text-[#8B8B95] mt-0.5">
                          Deadline: {new Date(camp.response_deadline).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                        {camp.scenario}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                            camp.status === 'launched'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                              : 'bg-amber-950/40 text-amber-300 border-amber-800/80'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize text-zinc-300">
                        {camp.default_difficulty}
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono tabular-nums">
                        {camp.deliveries?.length || 0}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1B1B1F] hover:bg-[#25252A] text-zinc-200 text-xs border border-[#28282D] transition-colors"
                        >
                          Inspect <ArrowUpRight className="w-3 h-3 text-[#8B8B95]" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
