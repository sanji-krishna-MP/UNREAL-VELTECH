'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  ShieldAlert,
  Sparkles,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  Bot,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

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

    const targetDept = departments.find((d) => d.name.toLowerCase().includes(dept.toLowerCase()));

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
        d.name.toLowerCase().includes(department.toLowerCase())
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
          target_department_id: targetDept?.id || null,
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

      setSuccessMsg('Draft saved successfully! You can launch it now or return to console.');
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
        d.name.toLowerCase().includes(department.toLowerCase())
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
          target_department_id: targetDept?.id || null,
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
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              CAMPAIGN BUILDER
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Configure Role-Specific Simulation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build and deploy adaptive mock phishing scenarios to measure and elevate organizational security.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Builder Form Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Settings */}
          <div className="md:col-span-1 space-y-5">
            <div className="cyber-card rounded-xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                Cohort Targeting
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Target Department
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDepartmentChange('Payroll')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border transition-colors ${
                      department === 'Payroll'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Payroll
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepartmentChange('Engineering')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border transition-colors ${
                      department === 'Engineering'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Engineering
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Scenario Template
                </label>
                <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs font-mono text-slate-200">
                  {scenario === 'payroll_direct_deposit'
                    ? 'Direct Deposit Fraud & Wire Redirection'
                    : 'Mock Repository SSH & Access Review'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    const diff = e.target.value as any;
                    setDifficulty(diff);
                    handleGenerate(department, scenario, diff);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="introductory">Introductory (Baseline)</option>
                  <option value="intermediate">Intermediate (Subtle Hooks)</option>
                  <option value="advanced">Advanced (Multi-factor Pressure)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Response Window Deadline
                </label>
                <input
                  type="datetime-local"
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Adaptation Card */}
              {adaptationExplanation && (
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Adaptive Cohort Logic:
                  </div>
                  <p className="text-slate-300">{adaptationExplanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Content Editor & Preview */}
          <div className="md:col-span-2 space-y-4">
            <div className="cyber-card rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Message Content Editor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-slate-900 text-cyan-400 border-cyan-800/60">
                    {generationMode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerate(department, scenario, difficulty)}
                    disabled={generating}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1"
                    title="Regenerate message"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {generating ? 'Generating...' : 'Regenerate'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Targeted Payroll Direct Deposit Simulation"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Email Body (Rendered as Plain Text)
                </label>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Simulation copy..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || launching}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving Draft...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={handleDirectLaunch}
                  disabled={launching || saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-semibold shadow-md shadow-cyan-950 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {launching ? 'Deploying...' : 'Launch Simulation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
