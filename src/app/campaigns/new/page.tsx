'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewCampaignPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<'Payroll' | 'Engineering'>('Payroll');
  const [scenario, setScenario] = useState('payroll_direct_deposit');
  const [difficulty, setDifficulty] = useState<'introductory' | 'intermediate' | 'advanced'>('introductory');
  const [responseDeadline, setResponseDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  // Generated Variant State
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generationMode, setGenerationMode] = useState('Template mode');
  const [adaptationExplanation, setAdaptationExplanation] = useState('');

  // Department metadata
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (!authRes.ok || !authData.authenticated || authData.user.role !== 'officer') {
          router.push('/login');
          return;
        }
        setUser(authData.user);

        // Fetch departments
        const deptRes = await fetch('/api/departments');
        const deptData = await deptRes.json();
        if (deptRes.ok && deptData.departments) {
          setDepartments(deptData.departments);
        }

        // Trigger initial template generation
        handleGenerate('Payroll', 'payroll_direct_deposit', 'introductory');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleDepartmentChange = (newDept: 'Payroll' | 'Engineering') => {
    setDepartment(newDept);
    const newScenario = newDept === 'Payroll' ? 'payroll_direct_deposit' : 'engineering_repo_access';
    setScenario(newScenario);
    handleGenerate(newDept, newScenario, difficulty);
  };

  const handleGenerate = async (
    dept: string,
    scen: string,
    diff: 'introductory' | 'intermediate' | 'advanced'
  ) => {
    setGenerating(true);
    setError(null);

    const targetDept = departments.find((d) => d.name?.toLowerCase().includes(dept.toLowerCase()));

    try {
      const res = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: dept,
          scenario: scen,
          difficulty: diff,
          targetDepartmentId: targetDept?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate simulation variant');

      if (data.variant) {
        setSubject(data.variant.subject);
        setBody(data.variant.body);
        setGenerationMode(data.generationMode);
        setAdaptationExplanation(data.adaptationExplanation || '');
        if (!title) {
          setTitle(`Targeted ${dept} ${scen === 'payroll_direct_deposit' ? 'Direct Deposit' : 'Repo Access'} Defense Simulation`);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title || !subject || !body) {
      setError('Title, subject, and body are required to save draft.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const targetDept = departments.find((d) =>
        d.name?.toLowerCase().includes(department.toLowerCase())
      );

      let safeDeadline = new Date(Date.now() + 7 * 86400000).toISOString();
      if (responseDeadline) {
        const d = new Date(responseDeadline);
        if (!isNaN(d.getTime())) safeDeadline = d.toISOString();
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scenario,
          target_department_id: targetDept?.id || department,
          default_difficulty: difficulty,
          response_deadline: safeDeadline,
          generation_mode: generationMode,
          variants: [
            {
              job_role: department === 'Payroll' ? 'Payroll Specialist' : 'Senior Staff Engineer',
              department_name: department,
              subject,
              body,
              adaptation_reason: adaptationExplanation,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errDetail = data.details?.fieldErrors
          ? Object.entries(data.details.fieldErrors)
              .map(([f, errs]: any) => `${f}: ${errs.join(', ')}`)
              .join('; ')
          : null;
        throw new Error(errDetail || data.error || 'Failed to save draft');
      }

      setSuccessMsg('Draft saved successfully.');
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDirectLaunch = async () => {
    if (!title || !subject || !body) {
      setError('Title, subject, and body are required.');
      return;
    }

    setLaunching(true);
    setError(null);

    try {
      const targetDept = departments.find((d) =>
        d.name?.toLowerCase().includes(department.toLowerCase())
      );

      let safeDeadline = new Date(Date.now() + 7 * 86400000).toISOString();
      if (responseDeadline) {
        const d = new Date(responseDeadline);
        if (!isNaN(d.getTime())) safeDeadline = d.toISOString();
      }

      // 1. Create draft
      const draftRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scenario,
          target_department_id: targetDept?.id || department,
          default_difficulty: difficulty,
          response_deadline: safeDeadline,
          generation_mode: generationMode,
          variants: [
            {
              job_role: department === 'Payroll' ? 'Payroll Specialist' : 'Senior Staff Engineer',
              department_name: department,
              subject,
              body,
              adaptation_reason: adaptationExplanation,
            },
          ],
        }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) {
        const errDetail = draftData.details?.fieldErrors
          ? Object.entries(draftData.details.fieldErrors)
              .map(([f, errs]: any) => `${f}: ${errs.join(', ')}`)
              .join('; ')
          : null;
        throw new Error(errDetail || draftData.error || 'Failed to initialize draft for launch');
      }

      const campaignId = draftData.campaign.id;

      // 2. Launch campaign
      const launchRes = await fetch(`/api/campaigns/${campaignId}/launch`, {
        method: 'POST',
      });

      const launchData = await launchRes.json();
      if (!launchRes.ok) throw new Error(launchData.error || 'Launch failed');

      router.push(`/campaigns/${campaignId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to launch campaign');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <AppShell
      user={user}
      title="Configure Simulation"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Configure Simulation' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Configure Role-Specific Simulation
          </h1>
          <p className="text-xs text-[#8B8B95]">
            Target employee cohorts with adaptive mock phishing templates to evaluate organizational baseline.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-md bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2-Column Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Targeting & Cohort Parameters */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8B8B95]">
                Cohort Targeting
              </h2>

              {/* Department Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Target Department
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDepartmentChange('Payroll')}
                    className={`py-2 px-3 text-xs rounded-md font-medium border transition-colors ${
                      department === 'Payroll'
                        ? 'bg-[#1B1B1F] text-zinc-100 border-zinc-400'
                        : 'bg-[#09090B] border-[#28282D] text-[#8B8B95] hover:text-zinc-200'
                    }`}
                  >
                    Payroll
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepartmentChange('Engineering')}
                    className={`py-2 px-3 text-xs rounded-md font-medium border transition-colors ${
                      department === 'Engineering'
                        ? 'bg-[#1B1B1F] text-zinc-100 border-zinc-400'
                        : 'bg-[#09090B] border-[#28282D] text-[#8B8B95] hover:text-zinc-200'
                    }`}
                  >
                    Engineering
                  </button>
                </div>
              </div>

              {/* Scenario Template (read-only indicator) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Scenario Template
                </label>
                <div className="bg-[#09090B] rounded-md p-2.5 border border-[#28282D] text-xs font-mono text-zinc-300">
                  {scenario === 'payroll_direct_deposit'
                    ? 'Direct Deposit Fraud & Wire Redirection'
                    : 'Mock Repository SSH & Access Review'}
                </div>
              </div>

              {/* Difficulty Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    const diff = e.target.value as any;
                    setDifficulty(diff);
                    handleGenerate(department, scenario, diff);
                  }}
                  className="w-full bg-[#09090B] border border-[#28282D] rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400"
                >
                  <option value="introductory">Introductory (Baseline)</option>
                  <option value="intermediate">Intermediate (Subtle Hooks)</option>
                  <option value="advanced">Advanced (Multi-factor Pressure)</option>
                </select>
              </div>

              {/* Response Deadline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Response Window Deadline
                </label>
                <input
                  type="datetime-local"
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#28282D] rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400"
                />
              </div>

              {/* Adaptation Logic */}
              {adaptationExplanation && (
                <div className="p-3 rounded-md bg-[#1B1B1F] border border-[#28282D] text-[11px] text-zinc-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-zinc-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Adaptive Cohort Logic
                  </div>
                  <p className="text-[#8B8B95] leading-relaxed">{adaptationExplanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Message Content Editor & Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#28282D]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8B8B95]" />
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    Message Content Editor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#28282D] bg-[#09090B] text-zinc-400">
                    {generationMode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerate(department, scenario, difficulty)}
                    disabled={generating}
                    className="flex items-center gap-1 text-[11px] text-[#8B8B95] hover:text-zinc-200 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Campaign Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Engineering SSH Review Simulation"
                  className="w-full bg-[#09090B] border border-[#28282D] rounded-md px-3 py-2 text-xs text-zinc-100 placeholder-[#8B8B95] focus:outline-none focus:border-zinc-400"
                />
              </div>

              {/* Email Subject Line */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full bg-[#09090B] border border-[#28282D] rounded-md px-3 py-2 text-xs text-zinc-100 font-mono placeholder-[#8B8B95] focus:outline-none focus:border-zinc-400"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Email Body (Rendered as Plain Text)
                </label>
                <textarea
                  rows={9}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Simulation message copy..."
                  className="w-full bg-[#09090B] border border-[#28282D] rounded-md p-3 text-xs text-zinc-200 placeholder-[#8B8B95] focus:outline-none focus:border-zinc-400 font-mono leading-relaxed"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#28282D]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving || launching}
                  className="gap-1.5 text-xs text-zinc-300 hover:text-white"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>

                <Button
                  type="button"
                  onClick={handleDirectLaunch}
                  disabled={launching || saving}
                  className="gap-1.5 text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  {launching ? 'Deploying...' : 'Launch Simulation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
