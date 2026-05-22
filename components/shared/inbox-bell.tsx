'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type NotifRow,
} from '@/lib/actions/inbox';
import { formatRupiah, formatTanggal } from '@/lib/format';

function notifText(n: NotifRow): {
  title: string;
  description: string;
  href: string;
} {
  const p = n.payload as Record<string, unknown>;
  const projectId = String(p.project_id ?? '');
  switch (n.type) {
    case 'milestone_comment':
      return {
        title: `Komentar baru di ${String(p.milestone_title ?? 'milestone')}`,
        description: `${String(p.project_title ?? '')} · ${p.by_role === 'admin' ? 'pembimbing' : 'klien'}`,
        href: `/projects/${projectId}/comments`,
      };
    case 'milestone_status':
      return {
        title: `${String(p.milestone_title ?? 'Milestone')}: ${String(p.new_status ?? '')}`,
        description: String(p.project_title ?? ''),
        href: `/projects/${projectId}`,
      };
    case 'payment_verified':
      return {
        title: 'Pembayaran terverifikasi',
        description: `${formatRupiah(Number(p.amount ?? 0))} · ${String(p.project_title ?? '')}`,
        href: `/projects/${projectId}/finance`,
      };
    case 'project_status':
      return {
        title: `Status proyek: ${String(p.new_status ?? '')}`,
        description: String(p.project_title ?? ''),
        href: `/projects/${projectId}`,
      };
    case 'invite_activated':
      return {
        title: 'Klien aktifkan portal',
        description: String(p.project_title ?? ''),
        href: '/clients',
      };
    default:
      return { title: 'Notifikasi', description: '', href: '/dashboard' };
  }
}

export function InboxBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotifRow[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await unreadNotificationCount();
      if (!cancelled && res.ok) setCount(res.data.count);
    }
    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    start(async () => {
      const res = await listMyNotifications({ limit: 10 });
      if (res.ok) setItems(res.data);
    });
  }, [open]);

  function handleClickItem(n: NotifRow) {
    const { href } = notifText(n);
    start(async () => {
      if (!n.read_at) {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
          ),
        );
        setCount((c) => Math.max(0, c - 1));
      }
      setOpen(false);
      router.push(href);
    });
  }

  function handleMarkAll() {
    start(async () => {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((x) => ({ ...x, read_at: new Date().toISOString() })),
      );
      setCount(0);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md border bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Aktivitas"
        >
          <Bell className="h-4 w-4" />
          {count > 0 ? (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div
          className="flex items-center justify-between border-b px-3 py-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-sm font-semibold">Aktivitas</span>
          {count > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleMarkAll}>
              Tandai semua
            </Button>
          ) : null}
        </div>
        <ul className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <li className="p-4 text-center text-xs text-[var(--text-muted)]">
              Belum ada aktivitas.
            </li>
          ) : (
            items.map((n) => {
              const t = notifText(n);
              const unread = !n.read_at;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClickItem(n)}
                    className="block w-full border-b px-3 py-2 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-start gap-2">
                      {unread ? (
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]"
                        />
                      ) : (
                        <span className="w-1.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {t.title}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {t.description}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {formatTanggal(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
