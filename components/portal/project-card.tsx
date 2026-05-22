import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Coins, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatRupiah, formatTanggal } from '@/lib/format';

export type ProjectCardProps = {
  id: string;
  title: string;
  status: string;
  progressPercent: number;
  nextMilestoneTitle: string | null;
  nextMilestoneDue: string | null;
  totalPaid: number;
  totalValue: number;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draf',
  active: 'Aktif',
  'on-hold': 'Dijeda',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  active: 'brand',
  'on-hold': 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export function ProjectCard(p: ProjectCardProps) {
  const pct = Math.max(0, Math.min(100, Math.round(p.progressPercent)));
  const remaining = Math.max(0, p.totalValue - p.totalPaid);
  const tone = STATUS_TONE[p.status] ?? 'neutral';
  const label = STATUS_LABEL[p.status] ?? p.status;

  return (
    <Link
      href={`/portal/proyek/${p.id}`}
      className="surface-card group relative flex flex-col gap-4 overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40 transition-opacity group-hover:opacity-70"
        style={{
          background:
            'radial-gradient(circle, var(--brand-soft) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Proyek skripsi
          </span>
          <h3 className="font-display text-base font-semibold leading-snug text-[var(--text-display)] group-hover:underline">
            {p.title}
          </h3>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      <div className="relative">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Progres keseluruhan
          </span>
          <span className="font-mono text-sm font-semibold text-[var(--text-display)]">
            {pct}%
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--bg-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background:
                'linear-gradient(90deg, var(--brand) 0%, var(--brand-hover) 100%)',
            }}
          />
        </div>
      </div>

      <div className="relative grid gap-2 text-sm">
        <Row
          icon={<Target className="h-3.5 w-3.5" />}
          label="Tahap berikutnya"
          value={
            p.nextMilestoneTitle ? (
              <strong className="font-semibold text-[var(--text-primary)]">
                {p.nextMilestoneTitle}
              </strong>
            ) : (
              <span className="text-[var(--success)]">Semua tahap selesai 🎉</span>
            )
          }
        />
        {p.nextMilestoneDue ? (
          <Row
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            label="Target tanggal"
            value={
              <span className="text-[var(--text-secondary)]">
                {formatTanggal(p.nextMilestoneDue)}
              </span>
            }
          />
        ) : null}
        <Row
          icon={<Coins className="h-3.5 w-3.5" />}
          label="Pembayaran"
          value={
            <span className="text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">
                {formatRupiah(p.totalPaid)}
              </strong>
              {' dari '}
              {formatRupiah(p.totalValue)}
              {remaining > 0 ? (
                <span className="ml-1 text-[var(--warning)]">
                  · sisa {formatRupiah(remaining)}
                </span>
              ) : (
                <span className="ml-1 text-[var(--success)]">· lunas</span>
              )}
            </span>
          }
        />
      </div>

      <div
        className="relative -mx-5 -mb-5 mt-1 flex items-center justify-between border-t px-5 py-3 text-xs"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span className="text-[var(--text-muted)]">Lihat detail tahap</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-[var(--brand)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
