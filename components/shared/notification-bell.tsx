'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Loader2,
  MessageCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUrgentItems, type UrgentItem, type UrgentSeverity } from '@/lib/actions/notifications';
import { WA_TEMPLATES, normalizeWhatsApp, waLink } from '@/lib/whatsapp';

const POLL_INTERVAL_MS = 60_000;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DISMISS_STORAGE_KEY = () => `bimbingo:notif-dismissed:${todayKey()}`;

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY());
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY(), JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

const SEVERITY_DOT: Record<UrgentSeverity, string> = {
  urgent: 'bg-[var(--danger)]',
  warning: 'bg-[var(--warning)]',
  info: 'bg-[var(--info)]',
};

const TYPE_ICON: Record<UrgentItem['type'], React.ComponentType<{ className?: string }>> = {
  'deadline-overdue': AlertTriangle,
  'deadline-soon': CalendarClock,
  'project-stale': Clock,
  'payment-overdue': Coins,
};

const TYPE_GROUP_LABEL: Record<UrgentItem['type'], string> = {
  'deadline-overdue': 'Deadline lewat',
  'deadline-soon': 'Deadline mendekat',
  'project-stale': 'Proyek diam',
  'payment-overdue': 'Piutang lewat',
};

function WaQuickAction({ item }: { item: UrgentItem }) {
  const phone = item.client?.whatsapp ?? null;
  const normalized = normalizeWhatsApp(phone);
  if (!normalized || normalized.length < 10 || !item.client?.name) return null;

  // Pilih template berdasar tipe notif.
  const templateKey: keyof typeof WA_TEMPLATES =
    item.type === 'payment-overdue'
      ? 'payment'
      : item.type === 'deadline-overdue' || item.type === 'deadline-soon'
        ? 'deadline'
        : 'followup';

  const message = WA_TEMPLATES[templateKey].build({
    clientName: item.client.name,
    projectTitle: item.project?.title,
    daysToDeadline:
      item.type === 'deadline-overdue' || item.type === 'deadline-soon'
        ? item.daysFromToday
        : undefined,
    outstanding: item.project?.outstanding,
  });
  const url = waLink({ phone, message });
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Chat WhatsApp ${item.client.name}`}
      title={`Kirim reminder via WhatsApp ke ${item.client.name}`}
      className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--success)] hover:bg-[var(--success-soft)]"
    >
      <MessageCircle className="h-3 w-3" />
    </a>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = React.useState<UrgentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUrgentItems();
      if (result.ok) setItems(result.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchItems();
    const timer = window.setInterval(fetchItems, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [fetchItems]);

  // Refresh saat popover dibuka
  React.useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  const visible = React.useMemo(
    () => items.filter((it) => !dismissed.has(it.id)),
    [items, dismissed],
  );

  const urgentCount = visible.filter((i) => i.severity === 'urgent').length;
  const totalCount = visible.length;
  const hasUrgent = urgentCount > 0;

  function dismissItem(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }

  function dismissAll() {
    setDismissed((prev) => {
      const next = new Set(prev);
      for (const it of visible) next.add(it.id);
      saveDismissed(next);
      return next;
    });
  }

  function navigate(href: string, id: string) {
    setOpen(false);
    dismissItem(id);
    router.push(href);
  }

  const grouped = React.useMemo(() => {
    const g: Record<UrgentItem['type'], UrgentItem[]> = {
      'deadline-overdue': [],
      'deadline-soon': [],
      'project-stale': [],
      'payment-overdue': [],
    };
    for (const it of visible) g[it.type].push(it);
    return g;
  }, [visible]);

  return (
    <DropdownPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            totalCount > 0
              ? `Notifikasi (${totalCount}${hasUrgent ? `, ${urgentCount} mendesak` : ''})`
              : 'Notifikasi'
          }
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {totalCount > 0 ? (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white',
                hasUrgent ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]',
              )}
              aria-hidden
            >
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          ) : null}
        </Button>
      </DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[22rem] overflow-hidden rounded-xl border bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col">
              <span className="font-display text-sm font-semibold text-[var(--text-display)]">
                Perlu perhatian
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {loading ? 'Memperbarui…' : `${totalCount} item · refresh tiap 60 detik`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-muted)]" />
              ) : null}
              {totalCount > 0 ? (
                <button
                  type="button"
                  onClick={dismissAll}
                  className="text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Tandai dibaca
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {totalCount === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="font-display text-sm font-semibold text-[var(--text-display)]">
                  Semua aman
                </p>
                <p className="max-w-[14rem] text-xs leading-relaxed text-[var(--text-secondary)]">
                  Tidak ada deadline lewat, proyek diam, atau piutang yang perlu ditindak hari ini.
                </p>
              </div>
            ) : (
              (Object.keys(grouped) as UrgentItem['type'][]).map((type) => {
                const list = grouped[type];
                if (list.length === 0) return null;
                const Icon = TYPE_ICON[type];
                return (
                  <section key={type} className="px-2 py-1.5">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <Icon className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {TYPE_GROUP_LABEL[type]}
                      </span>
                      <span className="ml-auto text-[10px] text-[var(--text-muted)]">
                        {list.length}
                      </span>
                    </div>
                    <ul className="flex flex-col">
                      {list.map((it) => (
                        <li key={it.id} className="group relative">
                          <button
                            type="button"
                            onClick={() => navigate(it.href, it.id)}
                            className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                          >
                            <span
                              aria-hidden
                              className={cn(
                                'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                                SEVERITY_DOT[it.severity],
                              )}
                            />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {it.title}
                              </span>
                              <span className="truncate text-[11px] text-[var(--text-secondary)]">
                                {it.hint}
                              </span>
                            </span>
                            <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                          <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <WaQuickAction item={it} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissItem(it.id);
                              }}
                              aria-label={`Tandai dibaca: ${it.title}`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </div>

          <div
            className="flex items-center justify-between border-t bg-[var(--bg-subtle)] px-3 py-2 text-[10px] text-[var(--text-muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <span>Daftar dihitung dari data terkini</span>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="font-medium hover:text-[var(--text-primary)]"
            >
              Lihat dashboard →
            </Link>
          </div>
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}
