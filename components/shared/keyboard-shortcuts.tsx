'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Command as CommandIcon,
  Keyboard,
  Search,
  X,
} from 'lucide-react';

interface NavBinding {
  combo: string; // 'g c', 'g p', dll
  href: string;
  label: string;
  hint: string;
}

interface ActionBinding {
  combo: string;
  label: string;
  hint: string;
  handler: () => void;
}

const NAV_BINDINGS: NavBinding[] = [
  { combo: 'g d', href: '/dashboard', label: 'Dashboard', hint: 'Ringkasan harian' },
  { combo: 'g c', href: '/clients', label: 'Klien', hint: 'Daftar mahasiswa' },
  { combo: 'g p', href: '/projects', label: 'Proyek', hint: 'Skripsi & milestone' },
  { combo: 'g l', href: '/lecturers', label: 'Dosen', hint: 'Pembimbing & penguji' },
  { combo: 'g f', href: '/finance', label: 'Keuangan', hint: 'Ringkasan kas' },
  { combo: 'g s', href: '/settings', label: 'Pengaturan', hint: 'Workspace' },
];

const SEQUENCE_TTL_MS = 1000;
const HELP_TOGGLE = '?';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = React.useState(false);
  const sequenceRef = React.useRef<{ key: string; at: number } | null>(null);

  const actions = React.useMemo<ActionBinding[]>(
    () => [
      {
        combo: '⌘/Ctrl K',
        label: 'Command palette',
        hint: 'Cari halaman, klien, proyek, dosen',
        handler: () => {
          // Delegate ke command-palette via custom event.
          window.dispatchEvent(new Event('bimbingo:cmdk-open'));
        },
      },
      {
        combo: '?',
        label: 'Bantuan shortcut',
        hint: 'Tampilkan daftar ini',
        handler: () => setHelpOpen(true),
      },
    ],
    [],
  );

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Jangan intercept kalau user sedang ketik di form.
      if (isEditable(e.target)) return;

      // ESC tutup help
      if (e.key === 'Escape' && helpOpen) {
        setHelpOpen(false);
        return;
      }

      // ? buka help (shift+/)
      if (e.key === HELP_TOGGLE) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Cmd/Ctrl ditangani oleh command-palette sendiri, skip.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (!/^[a-z]$/.test(key)) return;

      const now = Date.now();
      const pending = sequenceRef.current;

      // Continuation dari sequence aktif (mis. setelah 'g')
      if (pending && now - pending.at < SEQUENCE_TTL_MS) {
        const combo = `${pending.key} ${key}`;
        const target = NAV_BINDINGS.find((b) => b.combo === combo);
        sequenceRef.current = null;
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }

      // Start sequence baru jika key = leader ('g')
      if (key === 'g') {
        sequenceRef.current = { key, at: now };
        return;
      }

      // Single-key (reserved future)
      sequenceRef.current = null;
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, helpOpen]);

  return (
    <DialogPrimitive.Root open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-[var(--brand)]" />
              <DialogPrimitive.Title className="font-display text-base font-semibold">
                Shortcut keyboard
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              aria-label="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description className="sr-only">
            Daftar shortcut keyboard untuk navigasi dan aksi cepat.
          </DialogPrimitive.Description>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
            <Section title="Navigasi" icon={<Search className="h-3 w-3" />}>
              {NAV_BINDINGS.map((b) => (
                <Row key={b.combo} combo={b.combo} label={b.label} hint={b.hint} />
              ))}
            </Section>

            <Section title="Aksi" icon={<CommandIcon className="h-3 w-3" />}>
              {actions.map((a) => (
                <Row key={a.combo} combo={a.combo} label={a.label} hint={a.hint} />
              ))}
            </Section>

            <p className="mt-4 rounded-md border border-dashed bg-[var(--bg-subtle)] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Tekan <kbd className="kbd">g</kbd> lalu tombol kedua dalam{' '}
              <span className="font-mono">1 detik</span> untuk lompat halaman.
              Shortcut tidak aktif saat sedang mengetik di form.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  );
}

function Row({ combo, label, hint }: { combo: string; label: string; hint: string }) {
  const keys = combo.split(' ');
  return (
    <li className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-[var(--bg-subtle)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-[var(--text-primary)]">{label}</span>
        <span className="truncate text-[11px] text-[var(--text-muted)]">{hint}</span>
      </div>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <span className="text-[10px] text-[var(--text-muted)]">lalu</span>
            ) : null}
            <kbd className="kbd">{k}</kbd>
          </React.Fragment>
        ))}
      </div>
    </li>
  );
}
