'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export function PortalHeader({ fullName }: { fullName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/auth/sign-out', { method: 'POST' });
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/portal" className="font-semibold">
          Bimbingo
        </Link>
        <nav className="hidden gap-4 text-sm sm:flex">
          <Link href="/portal" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/portal/pembayaran" className="hover:underline">
            Pembayaran
          </Link>
          <Link href="/portal/profile" className="hover:underline">
            Profil
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-[var(--text-muted)] sm:inline">
            {fullName}
          </span>
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
