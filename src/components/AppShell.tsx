'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  Inbox,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user?: {
    email: string;
    role: 'officer' | 'employee';
    employee?: {
      display_name: string;
      job_role: string;
      department?: { name: string };
    };
  } | null;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  user,
  title,
  breadcrumbs,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const isOfficer = user?.role === 'officer';

  const navItems = isOfficer
    ? [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          active: pathname === '/dashboard',
        },
        {
          label: 'Launch simulation',
          href: '/campaigns/new',
          icon: PlusCircle,
          active: pathname === '/campaigns/new',
        },
      ]
    : [
        {
          label: 'My inbox',
          href: '/inbox',
          icon: Inbox,
          active: pathname.startsWith('/inbox'),
        },
      ];

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Link
            href={isOfficer ? '/dashboard' : '/inbox'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-7 h-7 rounded-md bg-[#1B1B1F] border border-[#28282D] flex items-center justify-center text-zinc-100">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-100 leading-none">
                CyberShield
              </span>
              <span className="text-[10px] text-[#8B8B95] mt-1 font-mono leading-none">
                Enterprise Defense
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden p-1 rounded text-[#8B8B95] hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8B8B95]">
            {isOfficer ? 'Security Console' : 'Employee Portal'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  item.active
                    ? 'bg-[#1B1B1F] text-zinc-100 border border-[#28282D]'
                    : 'text-[#8B8B95] hover:text-zinc-200 hover:bg-[#1B1B1F]/50 border border-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4', item.active ? 'text-zinc-100' : 'text-[#8B8B95]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Identity & Logout at bottom */}
      {user && (
        <div className="pt-4 border-t border-[#28282D] space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-medium text-zinc-200 truncate">
                {user.employee?.display_name || user.email.split('@')[0]}
              </span>
              <span className="text-[11px] text-[#8B8B95] truncate">
                {isOfficer
                  ? 'Security Officer'
                  : `${user.employee?.department?.name || 'Staff'} · ${user.employee?.job_role || 'Employee'}`}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded text-[#8B8B95] hover:text-red-400 hover:bg-[#1B1B1F] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex">
      {/* Desktop Charcoal Sidebar (240px) */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#141416] border-r border-[#28282D] sticky top-0 h-screen z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Sheet / Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-[#141416] border-r border-[#28282D] z-50">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Slim Top Header (60px) */}
        <header className="h-14 shrink-0 bg-[#09090B] border-b border-[#28282D] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 -ml-1.5 rounded text-[#8B8B95] hover:text-zinc-200 hover:bg-[#141416]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex items-center gap-1.5 text-xs text-[#8B8B95] truncate">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#28282D]" />}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-zinc-200 transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-zinc-200 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : title ? (
              <h2 className="text-xs font-medium text-zinc-300 truncate">{title}</h2>
            ) : null}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
