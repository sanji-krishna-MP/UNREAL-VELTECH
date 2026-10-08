'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Route based on role
      if (data.user.role === 'officer') {
        router.push('/dashboard');
      } else {
        router.push('/inbox');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CyberShield2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 cyber-glow">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CyberShield Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Adaptive Phishing Defense & Awareness Platform
          </p>
        </div>

        {/* Card */}
        <div className="cyber-card rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500" />

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@cybershield.internal"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-cyan-950"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  Authenticate Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Selectors for Judges */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Demo Quick-Fill Accounts:
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillCredentials('officer@cybershield.internal')}
                className="w-full text-left p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-purple-300">Security Officer</span>
                  <p className="text-[10px] text-slate-500">officer@cybershield.internal</p>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Fill &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('payroll.alex@cybershield.internal')}
                className="w-full text-left p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-emerald-300">Payroll Employee</span>
                  <p className="text-[10px] text-slate-500">Alex Rivera (Payroll Dept)</p>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Fill &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('eng.devon@cybershield.internal')}
                className="w-full text-left p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-blue-300">Engineering Employee</span>
                  <p className="text-[10px] text-slate-500">Devon Vance (Staff Eng)</p>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Fill &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Controlled Cyber Defense Environment. Zero credentials or keys exposed in client bundles.
        </p>
      </div>
    </div>
  );
}
