'use client';

import * as React from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';

/**
 * Animated Flowing Silver Ribbon Artwork
 * High visibility, bold stroke widths (1.8px–3.8px), high opacity (0.55–0.92),
 * and complete full-span SVG curves sweeping across the entire left panel.
 */
const RibbonContourGroup = ({
  groupIndex,
  baseDuration,
}: {
  groupIndex: number;
  baseDuration: number;
}) => {
  const reduceMotion = useReducedMotion();
  const count = 34;

  const paths = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const groupShift = groupIndex === 1 ? 0 : 60;

      // Span curves across the entire height (-50 to 950) and width of the panel
      const startX = -180 - i * 6;
      const startY = -40 + i * 30 + groupShift;

      const cp1X = 260 + i * 14 - (groupIndex === 1 ? 30 : -20);
      const cp1Y = 180 + i * 26 + (groupIndex === 1 ? 20 : -40);

      const cp2X = 580 - i * 8 + groupShift;
      const cp2Y = 480 + i * 24;

      const endX = 1180 + i * 8;
      const endY = 580 + i * 22 + groupShift;

      const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

      // BOLD stroke widths: 2.0px to 3.8px
      const strokeWidth = 2.0 + t * 1.8;

      // STRONG, VISIBLE opacity: 0.55 to 0.92
      const opacity = 0.55 + t * 0.37;

      return {
        id: `${groupIndex}-${i}`,
        d,
        strokeWidth,
        opacity,
        duration: baseDuration + ((i * 5) % 6) * 1.2,
      };
    });
  }, [groupIndex, baseDuration]);

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none select-none"
      fill="none"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {paths.map((p) => (
        <motion.path
          key={p.id}
          d={p.d}
          stroke={groupIndex === 1 ? '#E4E4E7' : '#FFFFFF'}
          strokeWidth={p.strokeWidth}
          strokeOpacity={p.opacity}
          strokeLinecap="round"
          initial={{ pathLength: 1, pathOffset: 0 }}
          animate={
            reduceMotion
              ? undefined
              : {
                  pathOffset: [0, 1],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: p.duration,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }
          }
        />
      ))}
    </svg>
  );
};

interface LoginProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onQuickFill: (email: string) => void;
}

export function Login03View({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
  onQuickFill,
}: LoginProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#09090B] lg:grid lg:grid-cols-2">
      {/* Left Charcoal Brand Panel with Bold Flowing Silver Ribbon Artwork */}
      <aside className="relative hidden h-full flex-col justify-between overflow-hidden border-r border-[#28282D] bg-[#141416] p-12 xl:p-14 lg:flex">
        {/* Layer 1 & 2: Overlapping Flowing Silver Curves (68 bold paths total) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Group 1: 34 bold silver paths, cycle 24s */}
          <RibbonContourGroup groupIndex={1} baseDuration={24} />
          {/* Group 2: 34 crisp platinum paths, cycle 28s */}
          <RibbonContourGroup groupIndex={2} baseDuration={28} />
        </div>

        {/* Top Brand Identity */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1B1B1F]/90 backdrop-blur-md border border-[#28282D] flex items-center justify-center text-zinc-100 shadow-md">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-100 drop-shadow-sm">
              CyberShield
            </span>
            <span className="text-[11px] text-zinc-400 drop-shadow-sm font-mono">
              Human Risk & Awareness
            </span>
          </div>
        </div>

        {/* Serif Statement at Lower Portion with Frost Card for Readability */}
        <figure className="relative z-10 mt-auto flex flex-col gap-4 max-w-lg p-6 sm:p-7 rounded-xl bg-[#141416]/85 backdrop-blur-md border border-[#28282D]/70 shadow-2xl">
          <blockquote className="font-serif text-3xl xl:text-4xl 2xl:text-[42px] leading-[1.22] tracking-tight text-white drop-shadow-md">
            “Stronger security starts with everyday decisions.”
          </blockquote>
          <figcaption className="text-xs uppercase tracking-wider text-zinc-400 font-medium font-mono">
            CyberShield · Enterprise Human Risk & Defense
          </figcaption>
        </figure>
      </aside>

      {/* Right Near-Black Sign-In Panel */}
      <div className="relative flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 lg:py-20 bg-[#09090B]">
        <div className="relative z-10 mx-auto w-full max-w-sm space-y-8">
          {/* Mobile Brand Header */}
          <div className="flex items-center gap-2.5 lg:hidden mb-2">
            <div className="w-8 h-8 rounded-md bg-[#141416] border border-[#28282D] flex items-center justify-center text-zinc-100">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              CyberShield
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-zinc-100">
              Sign in to CyberShield.
            </h1>
            <p className="text-sm text-[#8B8B95]">
              Access your security workspace.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Corporate email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8B8B95] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cybershield.internal"
                  required
                  className="w-full pl-9 pr-3.5 h-10 bg-[#111113] border border-[#28282D] rounded-md text-sm text-zinc-100 placeholder-[#8B8B95] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8B8B95] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3.5 h-10 bg-[#111113] border border-[#28282D] rounded-md text-sm text-zinc-100 placeholder-[#8B8B95] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 bg-zinc-100 text-zinc-900 hover:bg-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Compact Demo Credential Quick-Fill Section */}
          <div className="pt-6 border-t border-[#28282D] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8B8B95]">
              <span className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                Demo test accounts
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Auto-fill</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => onQuickFill('officer@cybershield.internal')}
                className="w-full text-left px-3 py-2 rounded-md bg-[#111113] hover:bg-[#1B1B1F] border border-[#28282D] text-xs text-zinc-300 flex items-center justify-between transition-colors group"
              >
                <div>
                  <span className="font-medium text-zinc-200">Security Officer</span>
                  <p className="text-[11px] text-[#8B8B95]">officer@cybershield.internal</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B8B95] group-hover:text-zinc-200 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => onQuickFill('payroll.alex@cybershield.internal')}
                className="w-full text-left px-3 py-2 rounded-md bg-[#111113] hover:bg-[#1B1B1F] border border-[#28282D] text-xs text-zinc-300 flex items-center justify-between transition-colors group"
              >
                <div>
                  <span className="font-medium text-zinc-200">Alex Rivera</span>
                  <p className="text-[11px] text-[#8B8B95]">Payroll Specialist</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B8B95] group-hover:text-zinc-200 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => onQuickFill('eng.devon@cybershield.internal')}
                className="w-full text-left px-3 py-2 rounded-md bg-[#111113] hover:bg-[#1B1B1F] border border-[#28282D] text-xs text-zinc-300 flex items-center justify-between transition-colors group"
              >
                <div>
                  <span className="font-medium text-zinc-200">Devon Vance</span>
                  <p className="text-[11px] text-[#8B8B95]">Staff Engineer</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B8B95] group-hover:text-zinc-200 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
