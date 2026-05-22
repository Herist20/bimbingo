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

const STATUS_TONE: Record<MilestoneStatus, 'neutral' | 'brand' | 'warning' | 'success'> = {
  'not-started': 'neutral',
  'in-progress': 'brand',
  submitted: 'brand',
  revisi: 'warning',
  approved: 'success',
  done: 'success',
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
      <p className="text-sm text-[var(--text-muted)]">
        Belum ada tahapan tercatat.
      </p>
    );
  }
  return (
    <ul
      className="divide-y rounded-md border"
      style={{ borderColor: 'var(--border)' }}
    >
      {milestones.map((m) => (
        <li
          key={m.id}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <p className="font-medium">
              <span className="mr-2 text-[var(--text-muted)]">#{m.sequence}</span>
              {m.title}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {m.due_date
                ? `Target: ${formatTanggal(m.due_date)}`
                : 'Tanpa target tanggal'}
            </p>
          </div>
          <Badge tone={STATUS_TONE[m.status]}>{STATUS_LABEL[m.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}
