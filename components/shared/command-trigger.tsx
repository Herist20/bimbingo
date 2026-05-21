'use client';

import { Search } from 'lucide-react';
import { openCommandPalette } from './command-palette';

export function CommandTrigger() {
  return (
    <button
      type="button"
      onClick={() => openCommandPalette()}
      className="group flex h-9 items-center gap-2 rounded-md border bg-[var(--bg-elevated)] px-2.5 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] md:min-w-[260px]"
      style={{ borderColor: 'var(--border)' }}
      aria-label="Buka command palette"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden flex-1 truncate md:inline">
        Cari halaman, klien, atau aksi…
      </span>
      <span className="ml-auto inline-flex items-center gap-1">
        <kbd className="kbd">⌘</kbd>
        <kbd className="kbd">K</kbd>
      </span>
    </button>
  );
}
