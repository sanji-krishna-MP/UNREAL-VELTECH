'use client';

import * as React from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';

/**
 * Animated Flowing Silver Ribbon Artwork
 * Features two overlapping groups of 32 smooth SVG cubic curves each (~64 paths total).
 * Curves enter from beyond the left edge, sweep gracefully through the middle/lower panel,
 * and flow toward the lower-right edge with varied curvature, spacing, silver stroke (#D4D4D8),
 * 0.25–0.55 stroke opacity, and 0.7–1.4px stroke widths.
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
      // Offset calculations to create layered flowing ribbons
      const offsetFactor = i / count;
      const groupShift = groupIndex === 1 ? 0 : 45;

      // Cubic Bézier curve entering beyond the left edge (-120 to -60)
      // sweeping through middle/lower panel, and exiting toward lower-right (1000 to 1100, 650 to 800)
      const startX = -120 - i * 4;
      const startY = 80 + i * 14 + groupShift;

      const cp1X = 220 + i * 8 - (groupIndex === 1 ? 20 : 0);
      const cp1Y = 240 + i * 9 + (groupIndex === 1 ? 10 : -25);

      const cp2X = 520 - i * 6 + groupShift;
      const cp2Y = 460 + i * 8;

      const endX = 1050 + i * 8;
      const endY = 560 + i * 11 + groupShift;

      const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      
      // Stroke widths from 0.7px to 1.4px
      const strokeWidth = 0.75 + offsetFactor * 0.65;
      
      // Stroke opacity tuned between 0.25 and 0.52 for visible, elegant silver lines
      const opacity = 0.24 + offsetFactor * 0.28;

      return {
        id: `${groupIndex}-${i}`,
        d,
        strokeWidth,
        opacity,
        duration: baseDuration + ((i * 7) % 7) * 0.8,
      };
    });
  }, [groupIndex, baseDuration]);

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none select-none"
      fill="none"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {paths.map((p) => (
        <motion.path
          key={p.id}
          d={p.d}
          stroke="#D4D4D8"
          strokeWidth={p.strokeWidth}
          strokeOpacity={p.opacity}
          strokeLinecap="round"
          initial={reduceMotion ? { pathLength: 1, pathOffset: 0 } : { pathLength: 0.35, pathOffset: 0 }}
          animate={
            reduceMotion
              ? undefined
              : {
                  pathLength: [0.35, 0.95, 0.35],
                  pathOffset: [0, 1, 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: p.duration,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
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
      {/* Left Charcoal Brand Panel with Enhanced Silver Ribbon Artwork */}
      <aside className="relative hidden h-full flex-col justify-between overflow-hidden border-r border-[#28282D] bg-[#141416] p-12 xl:p-14 lg:flex">
        {/* Layer 1 & 2: Overlapping Flowing Silver Curves (68 paths total) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Group 1: Cycle ~22–26s */}
          <RibbonContourGroup groupIndex={1} baseDuration={24} />
          {/* Group 2: Cycle ~27–31s */}
          <RibbonContourGroup groupIndex={2} baseDuration={28} />
        </div>

        {/* Localized Readability Gradient behind quote */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(20,20,22,0.1) 0%, rgba(20,20,22,0.4) 50%, rgba(20,20,22,0.85) 90%, #141416 100%)',
          }}
        />

        {/* Top Brand Identity */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1B1B1F] border border-[#28282D] flex items-center justify-center text-zinc-100 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              CyberShield
            </span>
            <span className="text-[11px] text-[#8B8B95]">
              Human Risk & Awareness
            </span>
          </div>
        </div>

        {/* Serif Statement at Lower Portion (Intentional 2-3 line layout) */}
        <figure className="relative z-10 mt-auto flex flex-col gap-4 max-w-lg">
          <blockquote className="font-serif text-3xl xl:text-4xl 2xl:text-[44px] leading-[1.22] tracking-tight text-zinc-100 drop-shadow-sm">
            “Stronger security starts with everyday decisions.”
          </blockquote>
          <figcaption className="text-xs uppercase tracking-wider text-[#8B8B95] font-medium font-mono">
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
