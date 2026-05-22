import { Check, Circle, CircleDot, FileEdit, FileWarning, Hourglass } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatTanggal } from '@/lib/format';

type MilestoneStatus =
  | 'not-started'
  | 'in-progress'
  | 'submitted'
  | 'revisi'
  | 'approved'
  | 'done';

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  'not-started': 'Belum mulai',
  'in-progress': 'Dikerjakan',
  submitted: 'Diserahkan',
  revisi: 'Revisi',
  approved: 'Disetujui',
  done: 'Selesai',
};

const STATUS_TONE: Record<
  MilestoneStatus,
  'neutral' | 'brand' | 'warning' | 'success'
> = {
  'not-started': 'neutral',
  'in-progress': 'brand',
  submitted: 'brand',
  revisi: 'warning',
  approved: 'success',
  done: 'success',
};

const STATUS_ICON: Record<MilestoneStatus, React.ComponentType<{ className?: string }>> = {
  'not-started': Circle,
  'in-progress': CircleDot,
  submitted: Hourglass,
  revisi: FileWarning,
  approved: Check,
  done: Check,
};

export type MilestoneRow = {
  id: string;
  title: string;
  sequence: number;
  due_date: string | null;
  status: MilestoneStatus;
};

export function MilestoneList({ milestones }: { milestones: MilestoneRow[] }) {
  if (milestones.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-lg border bg-[var(--bg-subtle)] p-8 text-center"
        style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}
      >
        <FileEdit className="h-5 w-5 text-[var(--text-muted)]" />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Belum ada tahapan tercatat
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Pembimbing akan menambahkan milestone bab setelah onboarding selesai.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {milestones.map((m, idx) => {
        const Icon = STATUS_ICON[m.status];
        const tone = STATUS_TONE[m.status];
        const isLast = idx === milestones.length - 1;
        const isDone = m.status === 'approved' || m.status === 'done';
        const isActive =
          m.status === 'in-progress' ||
          m.status === 'submitted' ||
          m.status === 'revisi';

        return (
          <li key={m.id} className="relative flex gap-4 pb-4 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-[18px] top-9 h-[calc(100%-1rem)] w-px"
                style={{
                  background: isDone
                    ? 'var(--success)'
                    : 'var(--border-strong)',
                  opacity: isDone ? 0.5 : 1,
                }}
              />
            ) : null}

            <span
              className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
              style={{
                borderColor: isDone
                  ? 'var(--success)'
                  : isActive
                    ? 'var(--brand)'
                    : 'var(--border-strong)',
                backgroundColor: isDone
                  ? 'var(--success-soft)'
                  : isActive
                    ? 'var(--brand-soft)'
                    : 'var(--bg-elevated)',
                color: isDone
                  ? 'var(--success)'
                  : isActive
                    ? 'var(--brand-ink)'
                    : 'var(--text-muted)',
              }}
            >
              <Icon className="h-4 w-4" />
            </span>

            <div
              className="flex-1 rounded-lg border bg-[var(--bg-subtle)] p-3 transition-colors"
              style={{
                borderColor: isActive ? 'var(--brand-soft)' : 'var(--border)',
                boxShadow: isActive ? 'var(--shadow-glow)' : undefined,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold text-[var(--text-muted)]">
                      #{m.sequence.toString().padStart(2, '0')}
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {m.title}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {m.due_date
                      ? `Target ${formatTanggal(m.due_date)}`
                      : 'Tanpa target tanggal'}
                  </p>
                </div>
                <Badge tone={tone}>{STATUS_LABEL[m.status]}</Badge>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
