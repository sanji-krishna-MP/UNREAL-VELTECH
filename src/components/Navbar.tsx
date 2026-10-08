'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, ShieldAlert, LogOut, Inbox, LayoutDashboard, PlusCircle, BookOpen, User } from 'lucide-react';

interface NavbarProps {
  user?: {
    email: string;
    role: 'officer' | 'employee';
    employee?: {
      display_name: string;
      job_role: string;
      department?: { name: string };
    };
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user?.role === 'officer' ? '/dashboard' : '/inbox'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">CYBERSHIELD</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                  DEFENSE OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Enterprise Simulation & Defense</p>
            </div>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {user.role === 'officer' ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Officer Console
                  </Link>
                  <Link
                    href="/campaigns/new"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      pathname === '/campaigns/new'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Launch Simulation
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/inbox"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      pathname.startsWith('/inbox')
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    My Inbox
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-slate-200">
                    {user.employee?.display_name || user.email.split('@')[0]}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {user.role === 'officer'
                    ? 'Security Officer'
                    : `${user.employee?.department?.name || 'Staff'} • ${user.employee?.job_role || 'Employee'}`}
                </span>
              </div>

              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  user.role === 'officer'
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800/50'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                }`}
              >
                {user.role}
              </span>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
