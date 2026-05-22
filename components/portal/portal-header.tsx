'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/portal', label: 'Beranda' },
  { href: '/portal/pembayaran', label: 'Pembayaran' },
  { href: '/portal/profile', label: 'Profil' },
];

export function PortalHeader({ fullName }: { fullName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/auth/sign-out', { method: 'POST' });
    router.push('/portal/login');
    router.refresh();
  }

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--bg-elevated)_88%,transparent)]"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="group flex items-center gap-2"
            aria-label="Bimbingo Portal Klien"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg border bg-[var(--brand-soft)] text-[var(--brand-ink)] shadow-[var(--shadow-card)] transition-transform group-hover:-rotate-3"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <GraduationCap className="h-4 w-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-semibold tracking-tight text-[var(--text-display)]">
                Bimbingo
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Portal Klien
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto sm:gap-2">
          {NAV.map((item) => {
            const active =
              item.href === '/portal'
                ? pathname === '/portal'
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold text-[var(--brand-ink)]"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--brand-soft)',
              }}
              aria-hidden
            >
              {initials || 'K'}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">{fullName}</span>
          </div>
          <ThemeToggle />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            aria-label="Keluar"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
