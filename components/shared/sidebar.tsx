'use client';

import Link from 'next/link';
import { LifeBuoy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarNav } from './sidebar-nav';
import { useSidebar } from './sidebar-context';

export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 flex-col border-r p-4 transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-[68px] items-center px-2' : 'w-64',
      )}
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-subtle)',
      }}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <Link
        href="/dashboard"
        className={cn(
          'group mb-6 flex items-center rounded-lg transition-colors hover:bg-[var(--bg-muted)]',
          collapsed ? 'h-10 w-10 justify-center' : 'gap-2.5 px-1.5 py-1',
        )}
        title={collapsed ? 'Bimbingo' : undefined}
      >
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--brand)] text-[var(--bg-base)] shadow-[var(--shadow-glow)]"
        >
          <span className="font-display text-sm font-semibold">B</span>
        </span>
        {!collapsed ? (
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-tight text-[var(--text-display)]">
              Bimbingo
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Workspace
            </span>
          </span>
        ) : null}
      </Link>

      <SidebarNav />

      <div
        className={cn(
          'mt-auto flex flex-col gap-3 pt-4',
          collapsed && 'w-full items-center',
        )}
      >
        {!collapsed ? (
          <div
            className="rounded-lg border border-dashed p-3"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
              Cmd / Ctrl + K
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Buka command palette: lompat halaman, tambah klien, atau cari proyek dengan cepat.
            </p>
          </div>
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed text-[var(--brand)]"
            style={{ borderColor: 'var(--border-strong)' }}
            title="Cmd / Ctrl + K — command palette"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        )}

        {!collapsed ? (
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <LifeBuoy className="h-3 w-3" />
              v0.1 · MVP
            </span>
            <Link href="/settings" className="hover:text-[var(--text-primary)]">
              Bantuan
            </Link>
          </div>
        ) : (
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            title="Bantuan"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </aside>
  );
}
