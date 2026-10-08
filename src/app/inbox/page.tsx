'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  Mail,
  MailOpen,
  RotateCcw,
  BookOpen,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmployeeInboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchInbox();
  };

  // Check for any pending training assignment
  const pendingAssignment = deliveries
    .flatMap((d) => d.assignments || [])
    .find((a: any) => a.status === 'assigned');

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleManualRefresh}
      disabled={refreshing}
      className="gap-1.5 text-xs text-zinc-300 hover:text-white"
    >
      <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
    </Button>
  );

  return (
    <AppShell
      user={user}
      title="My Inbox"
      breadcrumbs={[{ label: 'Workspace' }, { label: 'My Inbox' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            My Inbox
          </h1>
          <p className="text-xs text-[#8B8B95]">
            Internal communications and corporate service notifications.
          </p>
        </div>

        {/* Pending Training Remediation Callout Banner */}
        {pendingAssignment && (
          <div className="rounded-lg bg-[#141416] border border-[#28282D] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-md bg-[#1B1B1F] border border-[#28282D] text-zinc-200 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-zinc-100">
                  Action Required: Security Micro-Lesson Assigned
                </h3>
                <p className="text-xs text-[#8B8B95] leading-relaxed">
                  A simulated security verification link was triggered. Complete the short 3-question lesson to reinforce hygiene.
                </p>
              </div>
            </div>

            <Button asChild size="sm" className="shrink-0 text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white">
              <Link href={`/training/${pendingAssignment.id}`}>
                Start Training &rarr;
              </Link>
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Messages List Container */}
        <div className="rounded-lg bg-[#111113] border border-[#28282D] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#28282D] flex items-center justify-between text-xs text-[#8B8B95]">
            <span className="font-medium">
              Received Messages ({deliveries.length})
            </span>
            <span className="font-mono text-[11px]">
              {user?.employee?.department?.name || 'Department'} · {user?.employee?.job_role || 'Employee'}
            </span>
          </div>

          {deliveries.length === 0 ? (
            <div className="py-16 text-center text-[#8B8B95] text-xs space-y-2">
              <Mail className="w-7 h-7 mx-auto opacity-40 text-zinc-400" />
              <p>Your inbox is empty. No simulation messages currently active for your cohort.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#28282D]/70">
              {deliveries.map((del) => {
                const events = del.events || [];
                const hasClick = events.some((e: any) => e.type === 'clicked');
                const hasReport = events.some((e: any) => e.type === 'reported');
                const hasOpen = events.some((e: any) => e.type === 'opened');

                return (
                  <Link
                    key={del.id}
                    href={`/inbox/${del.id}`}
                    className="block p-4 sm:p-5 hover:bg-[#1B1B1F]/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`p-2 rounded-md shrink-0 mt-0.5 border ${
                            hasOpen || hasClick
                              ? 'bg-[#141416] text-[#8B8B95] border-[#28282D]'
                              : 'bg-[#1B1B1F] text-zinc-200 border-zinc-600'
                          }`}
                        >
                          {hasOpen || hasClick ? (
                            <MailOpen className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-300">
                              Enterprise System Notification
                            </span>
                            <span className="text-[11px] text-[#8B8B95] font-mono tabular-nums">
                              {new Date(del.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <h3
                            className={`text-sm tracking-tight truncate ${
                              hasOpen || hasClick
                                ? 'font-normal text-zinc-300'
                                : 'font-medium text-zinc-100'
                            }`}
                          >
                            {del.subject}
                          </h3>

                          <p className="text-xs text-[#8B8B95] line-clamp-1">
                            {del.body ? del.body.slice(0, 85) + '...' : 'System notification'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {hasReport ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-950/40 text-emerald-300 border-emerald-800/80">
                            REPORTED SAFE
                          </span>
                        ) : hasOpen || hasClick ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-[#1B1B1F] text-[#8B8B95] border-[#28282D]">
                            OPENED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-zinc-800/60 text-zinc-200 border-zinc-700">
                            UNREAD
                          </span>
                        )}

                        <ChevronRight className="w-4 h-4 text-[#8B8B95] group-hover:text-zinc-200 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
