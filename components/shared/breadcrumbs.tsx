'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Klien',
  projects: 'Proyek',
  lecturers: 'Dosen',
  finance: 'Keuangan',
  settings: 'Pengaturan',
  profile: 'Profil',
  board: 'Board',
  files: 'Berkas',
  edit: 'Edit',
  new: 'Baru',
};

function labelFor(segment: string) {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment];
  // UUID-ish segment → tampilkan singkat
  if (/^[0-9a-f]{8}-/.test(segment)) return segment.slice(0, 8);
  return segment.replace(/-/g, ' ');
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  const crumbs = parts.map((seg, idx) => {
    const href = '/' + parts.slice(0, idx + 1).join('/');
    return { href, label: labelFor(seg) };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs md:flex">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Beranda</span>
      </Link>
      {crumbs.map((c, idx) => {
        const last = idx === crumbs.length - 1;
        return (
          <React.Fragment key={c.href}>
            <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" aria-hidden />
            {last ? (
              <span className="truncate font-medium capitalize text-[var(--text-primary)]">
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="truncate capitalize text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {c.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
