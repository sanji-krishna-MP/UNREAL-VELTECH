'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  Info,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { HviMetrics } from '@/lib/types';

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

  const fetchDashboardData = async () => {
    try {
      // 1. Check session
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

      // 2. Fetch Dashboard metrics
      const dashRes = await fetch('/api/dashboard');
      const dashData = await dashRes.json();

      if (!dashRes.ok) {
        throw new Error(dashData.error || 'Failed to fetch dashboard data');
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded">
                COMMAND CENTER
              </span>
              <span className="text-xs text-slate-400">Live Organization Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Human Vulnerability Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Telemetry'}
            </button>

            <Link
              href="/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-cyan-950"
            >
              <PlusCircle className="w-4 h-4" />
              New Simulation
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-sm text-red-300 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Main HVI Card */}
          <div className="lg:col-span-2 cyber-card rounded-xl p-5 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Human Vulnerability Index (HVI)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  0–100 observed risk score; higher is greater vulnerability
                </p>
              </div>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
                title="View PRD Formula Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                {metrics?.hvi !== null && metrics?.hvi !== undefined ? metrics.hvi : '—'}
              </span>
              <span className="text-xs text-slate-400">
                {metrics?.hvi === null ? 'Insufficient data' : '/ 100 benchmark'}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Eligible Evaluated Deliveries:</span>
              <span className="font-mono text-cyan-300 font-medium">
                {metrics?.eligibleCount || 0}
              </span>
            </div>
          </div>

          {/* Response Coverage */}
          <div className="cyber-card rounded-xl p-5 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Response Coverage
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">Interactions / launched</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white font-mono">
                {metrics?.responseCoverage !== null && metrics?.responseCoverage !== undefined
                  ? `${metrics.responseCoverage}%`
                  : '—'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
              {metrics?.interactionCount || 0} of {metrics?.launchedCount || 0} participants
            </p>
          </div>

          {/* Click Rate */}
          <div className="cyber-card rounded-xl p-5 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Click Failure Rate
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">Clicks / eligible</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-red-400 font-mono">
                {metrics?.clickRate !== null && metrics?.clickRate !== undefined
                  ? `${metrics.clickRate}%`
                  : '—'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
              {metrics?.clickedCount || 0} failed simulations
            </p>
          </div>

          {/* Training Completion */}
          <div className="cyber-card rounded-xl p-5 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Micro-Training
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">Completed / assigned</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-emerald-400 font-mono">
                {metrics?.trainingCompletionRate !== null &&
                metrics?.trainingCompletionRate !== undefined
                  ? `${metrics.trainingCompletionRate}%`
                  : '—'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
              {metrics?.trainingCompletedCount || 0} of {metrics?.trainingTotalCount || 0} resolved
            </p>
          </div>
        </div>

        {/* PRD Formula Modal */}
        {showFormulaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="cyber-card rounded-xl max-w-lg w-full p-6 border border-cyan-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  PRD Human Vulnerability Formula
                </h3>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3">
                <p>
                  A delivery represents one employee’s participation in one launched campaign.
                  Eligible deliveries have interacted OR passed the response deadline.
                </p>

                <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-red-300">
                    <span>Any simulated link click:</span>
                    <span className="font-bold">100 risk pts</span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>Otherwise any report:</span>
                    <span className="font-bold">0 risk pts</span>
                  </div>
                  <div className="flex justify-between text-yellow-300">
                    <span>Otherwise opened only:</span>
                    <span className="font-bold">25 risk pts</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Expired without interaction:</span>
                    <span className="font-bold">0 risk pts</span>
                  </div>
                </div>

                <p className="text-slate-400 italic">
                  * Note: Unexpired untouched deliveries are excluded from the denominator.
                  Clicks take precedence over reports. Completed training does not erase historical failures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Department Breakdown */}
        <div className="cyber-card rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Department Vulnerability Profiles
            </h2>
            <span className="text-xs text-slate-400 font-mono">Live Relational Aggregates</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentStats.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No department simulations evaluated yet.</p>
            ) : (
              departmentStats.map((dept) => (
                <div
                  key={dept.name}
                  className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{dept.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {dept.launchedCount} launched simulations
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">HVI</span>
                      <div className="text-lg font-mono font-bold text-cyan-300">
                        {dept.hvi !== null ? dept.hvi : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500">Coverage:</span>
                      <p className="font-mono text-slate-200">
                        {dept.coverageRate !== null ? `${dept.coverageRate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Clicks:</span>
                      <p className="font-mono text-red-400">
                        {dept.clickRate !== null ? `${dept.clickRate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Training:</span>
                      <p className="font-mono text-emerald-400">
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

        {/* Campaigns Table */}
        <div className="cyber-card rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Simulated Defense Campaigns
            </h2>
            <Link
              href="/campaigns/new"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Configure New <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Campaign Title</th>
                  <th className="py-3 px-3">Scenario</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Difficulty</th>
                  <th className="py-3 px-3">Deliveries</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No campaigns yet. Click &quot;New Simulation&quot; to configure your first campaign.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-white">
                        <Link href={`/campaigns/${camp.id}`} className="hover:underline text-slate-200">
                          {camp.title}
                        </Link>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Deadline: {new Date(camp.response_deadline).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                        {camp.scenario}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            camp.status === 'launched'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                              : 'bg-yellow-950/40 text-yellow-300 border-yellow-800/60'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 capitalize text-slate-300 font-mono text-[11px]">
                        {camp.default_difficulty}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono">
                        {camp.deliveries?.length || 0}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs border border-slate-800 transition-colors"
                        >
                          Inspect <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
