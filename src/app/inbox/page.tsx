'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Inbox,
  Mail,
  MailOpen,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Clock,
  RotateCcw,
} from 'lucide-react';

export default function EmployeeInboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authRes.ok || !authData.authenticated) {
        router.push('/login');
        return;
      }

      if (authData.user.role === 'officer') {
        router.push('/dashboard');
        return;
      }

      setUser(authData.user);

      const inboxRes = await fetch('/api/inbox');
      const inboxData = await inboxRes.json();
      if (!inboxRes.ok) throw new Error(inboxData.error || 'Failed to load inbox');

      setDeliveries(inboxData.deliveries || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // Check for any pending training assignment
  const pendingAssignment = deliveries.flatMap((d) => d.assignments || []).find((a: any) => a.status === 'assigned');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                SECURE WORKSPACE
              </span>
              <span className="text-xs text-slate-400">Internal Communications Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Inbox className="w-6 h-6 text-cyan-400" />
              Corporate Inbox
            </h1>
          </div>

          <button
            onClick={fetchInbox}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Pending Training Callout Banner */}
        {pendingAssignment && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-cyan-950/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Action Required: Micro-Training Assigned</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  You triggered a simulated spear-phishing test link. Complete the 3-question lesson to reinforce cyber hygiene.
                </p>
              </div>
            </div>
            <Link
              href={`/training/${pendingAssignment.id}`}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shrink-0 transition-colors shadow-md text-center"
            >
              Start Training Now &rarr;
            </Link>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Deliveries List */}
        <div className="cyber-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Received Messages ({deliveries.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Role: {user?.employee?.job_role || 'Employee'}
            </span>
          </div>

          {deliveries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Your inbox is empty. No simulation messages currently active for your cohort.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {deliveries.map((del) => {
                const events = del.events || [];
                const hasClick = events.some((e: any) => e.type === 'clicked');
                const hasReport = events.some((e: any) => e.type === 'reported');
                const hasOpen = events.some((e: any) => e.type === 'opened');
                const assignment = del.assignments?.[0];

                return (
                  <Link
                    key={del.id}
                    href={`/inbox/${del.id}`}
                    className="block p-4 sm:p-5 hover:bg-slate-900/60 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            hasOpen
                              ? 'bg-slate-900 text-slate-500 border border-slate-800'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {hasOpen ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-200">
                              Enterprise System Notification
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(del.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <h3
                            className={`text-sm tracking-tight ${
                              hasOpen ? 'font-normal text-slate-300' : 'font-semibold text-white'
                            }`}
                          >
                            {del.subject}
                          </h3>

                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {del.campaign?.title || 'System notification'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {hasClick ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 text-red-300 border border-red-800">
                            SIMULATION FAILED
                          </span>
                        ) : hasReport ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            REPORTED SAFE
                          </span>
                        ) : hasOpen ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                            OPENED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                            UNREAD
                          </span>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
