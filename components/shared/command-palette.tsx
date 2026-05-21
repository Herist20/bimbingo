'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  ArrowRight,
  CreditCard,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { globalSearch, type SearchHit } from '@/lib/actions/search';

export const CMDK_OPEN_EVENT = 'bimbingo:cmdk-open';

interface NavTarget {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}

const NAV_TARGETS: NavTarget[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, hint: 'Ringkasan harian' },
  { label: 'Klien', href: '/clients', icon: Users, hint: 'Daftar mahasiswa' },
  { label: 'Proyek', href: '/projects', icon: FolderKanban, hint: 'Skripsi & milestone' },
  { label: 'Dosen', href: '/lecturers', icon: GraduationCap, hint: 'Pembimbing & penguji' },
  { label: 'Keuangan', href: '/finance', icon: CreditCard, hint: 'Pembayaran & ringkasan' },
  { label: 'Pengaturan', href: '/settings', icon: Settings, hint: 'Profil & preferensi' },
];

const QUICK_ACTIONS: NavTarget[] = [
  { label: 'Tambah klien baru', href: '/clients/new', icon: Plus, hint: 'Catat mahasiswa dampingan' },
  { label: 'Buat proyek skripsi', href: '/projects/new', icon: Plus, hint: 'Mulai dampingan baru' },
  { label: 'Tambah dosen', href: '/lecturers/new', icon: Plus, hint: 'Daftarkan dosen pembimbing/penguji' },
];

const HIT_ICON: Record<SearchHit['kind'], React.ComponentType<{ className?: string }>> = {
  client: Users,
  project: FolderKanban,
  lecturer: GraduationCap,
};

const HIT_GROUP_LABEL: Record<SearchHit['kind'], string> = {
  client: 'Klien',
  project: 'Proyek',
  lecturer: 'Dosen',
};

const DEBOUNCE_MS = 250;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [truncated, setTruncated] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onCustom() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener(CMDK_OPEN_EVENT, onCustom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(CMDK_OPEN_EVENT, onCustom);
    };
  }, []);

  // Reset state saat palette ditutup.
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setTruncated(false);
      setSearching(false);
    }
  }, [open]);

  // Debounced server search.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setTruncated(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const reqId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      const result = await globalSearch(q);
      if (reqId !== requestIdRef.current) return; // stale response
      if (result.ok) {
        setHits(result.data.hits);
        setTruncated(result.data.truncated);
      } else {
        setHits([]);
        setTruncated(false);
      }
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const grouped = React.useMemo(() => {
    const g: Record<SearchHit['kind'], SearchHit[]> = { client: [], project: [], lecturer: [] };
    for (const h of hits) g[h.kind].push(h);
    return g;
  }, [hits]);

  const hasQuery = query.trim().length >= 2;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
          style={{ borderColor: 'var(--border-strong)' }}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command shouldFilter={!hasQuery}>
            <div className="relative">
              <CommandInput
                placeholder="Cari klien, proyek, dosen, atau halaman…"
                value={query}
                onValueChange={setQuery}
                autoFocus
              />
              {searching ? (
                <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[var(--text-muted)]" />
              ) : null}
            </div>
            <CommandList className="max-h-[60vh] py-2">
              <CommandEmpty>
                {hasQuery
                  ? searching
                    ? 'Mencari…'
                    : 'Tidak ada hasil. Coba kata lain.'
                  : 'Mulai ketik untuk cari klien, proyek, atau dosen.'}
              </CommandEmpty>

              {hasQuery && hits.length > 0 ? (
                <>
                  {(['client', 'project', 'lecturer'] as const).map((kind) => {
                    const list = grouped[kind];
                    if (list.length === 0) return null;
                    const HitIcon = HIT_ICON[kind];
                    return (
                      <CommandGroup key={kind} heading={HIT_GROUP_LABEL[kind]}>
                        {list.map((hit) => (
                          <CommandItem
                            key={hit.id}
                            value={`${hit.kind}-${hit.id}-${hit.label}-${hit.hint ?? ''}`}
                            onSelect={() => go(hit.href)}
                            className="gap-3"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                              <HitIcon className="h-3.5 w-3.5" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-sm">{hit.label}</span>
                              {hit.hint ? (
                                <span className="truncate text-[11px] text-[var(--text-muted)]">
                                  {hit.hint}
                                </span>
                              ) : null}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    );
                  })}
                  {truncated ? (
                    <p className="px-3 py-1 text-[10px] text-[var(--text-muted)]">
                      Sebagian hasil dipotong. Persempit kata kunci untuk lebih relevan.
                    </p>
                  ) : null}
                  <CommandSeparator />
                </>
              ) : null}

              <CommandGroup heading="Lompat ke">
                {NAV_TARGETS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <CommandItem
                      key={t.href}
                      value={`${t.label} ${t.hint ?? ''}`}
                      onSelect={() => go(t.href)}
                      className="gap-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-sm">{t.label}</span>
                        {t.hint ? (
                          <span className="text-[11px] text-[var(--text-muted)]">{t.hint}</span>
                        ) : null}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Aksi cepat">
                {QUICK_ACTIONS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <CommandItem
                      key={t.href}
                      value={`${t.label} ${t.hint ?? ''}`}
                      onSelect={() => go(t.href)}
                      className="gap-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-sm">{t.label}</span>
                        {t.hint ? (
                          <span className="text-[11px] text-[var(--text-muted)]">{t.hint}</span>
                        ) : null}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <div
              className="flex items-center justify-between border-t bg-[var(--bg-subtle)] px-3 py-2 text-[11px] text-[var(--text-muted)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[var(--brand)]" />
                Bimbingo cepat
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="kbd">↑↓</kbd>
                pilih
                <kbd className="kbd">↵</kbd>
                buka
                <kbd className="kbd">esc</kbd>
                tutup
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function openCommandPalette() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CMDK_OPEN_EVENT));
}
