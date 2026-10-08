'use client';

import * as React from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';

/**
 * FloatingPaths Component
 * Restores the original Hirael Login03 cubic Bézier curve geometry with position={1} and position={-1}.
 * Generates 36 fine silver strands per family (72 paths total) forming flexible curved threads
 * that enter from outside the left edge around the middle of the panel, travel gently across,
 * bend downward, and sweep toward the bottom and lower-right edges.
 *
 * Sizing: Uses an intentional viewBox (-180 -50 960 980) with uniform scaling (xMidYMid slice)
 * to preserve the curves' natural proportions on tall portrait desktop panels without distortion.
 */
const FloatingPaths = ({ position }: { position: number }) => {
  const reduceMotion = useReducedMotion();

  // 36 paths per group with fine stroke widths and subtle opacity variation
  const paths = React.useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
        380 - i * 5 * position
      } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
        152 - i * 5 * position
      } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.5 + (i / 36) * 0.45, // 0.5px to ~0.95px fine strokes
      opacity: 0.15 + (i / 36) * 0.22, // 0.15 to ~0.37 restrained opacity
      duration: 22 + ((i * 17) % 11), // 22s to 32s smooth cycles
    }));
  }, [position]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="h-full w-full pointer-events-none select-none"
        fill="none"
        viewBox="-180 -50 960 980"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="#BFC0C4"
            strokeOpacity={path.opacity}
            strokeWidth={path.width}
            strokeLinecap="round"
            initial={
              reduceMotion
                ? { pathLength: 1, pathOffset: 0 }
                : { pathLength: 0.35, pathOffset: 0 }
            }
            animate={
              reduceMotion
                ? undefined
                : {
                    pathLength: [0.35, 0.9, 0.35],
                    pathOffset: [0, 1, 0],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: path.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }
            }
          />
        ))}
      </svg>
    </div>
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
      {/* Left Charcoal Brand Panel (#161616) */}
      <aside className="relative hidden h-full flex-col justify-between overflow-hidden border-r border-[#262626] bg-[#161616] p-12 xl:p-14 lg:flex">
        {/* Fine Silver Strands: Two Overlapping Families of Flowing Curves (position={1} & position={-1}) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Broad subtle readability vignette (blends into the panel with NO rectangular boundary) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 25% 85%, rgba(22, 22, 22, 0.75) 0%, transparent 65%)',
          }}
        />

        {/* Top Brand Identity at Upper Left (Generous empty space around it) */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#212121] border border-[#2E2E2E] flex items-center justify-center text-zinc-100 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              CyberShield
            </span>
            <span className="text-[11px] text-[#8B8B95] font-mono">
              Human Risk & Awareness
            </span>
          </div>
        </div>

        {/* Serif Statement at Lower Portion directly over background (NO card, NO box border, NO rectangle) */}
        <figure className="relative z-10 mt-auto flex flex-col gap-3.5 max-w-lg">
          <blockquote className="font-serif text-3xl xl:text-4xl 2xl:text-[42px] leading-[1.25] tracking-tight text-[#F4F4F5] drop-shadow-sm">
            “Stronger security starts with everyday decisions.”
          </blockquote>
          <figcaption className="text-xs uppercase tracking-wider text-[#8B8B95] font-medium font-mono">
            CyberShield · Human Risk & Defense
          </figcaption>
        </figure>
      </aside>

      {/* Right Near-Black Sign-In Panel */}
      <div className="relative flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 lg:py-20 bg-[#09090B]">
        <div className="relative z-10 mx-auto w-full max-w-sm space-y-8">
          {/* Mobile Brand Header */}
          <div className="flex items-center gap-2.5 lg:hidden mb-2">
            <div className="w-8 h-8 rounded-md bg-[#161616] border border-[#262626] flex items-center justify-center text-zinc-100">
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
