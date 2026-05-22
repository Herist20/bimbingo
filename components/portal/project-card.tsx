import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function ProjectCard(p: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">{p.title}</CardTitle>
        <Badge>{p.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
            <span>Progres</span>
            <span>{p.progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded bg-[var(--bg-subtle)]">
            <div
              className="h-2 rounded bg-[var(--brand)]"
              style={{ width: `${p.progressPercent}%` }}
            />
          </div>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Tahap berikutnya: </span>
          {p.nextMilestoneTitle ? (
            <>
              <strong>{p.nextMilestoneTitle}</strong>
              {p.nextMilestoneDue && ` — ${formatTanggal(p.nextMilestoneDue)}`}
            </>
          ) : (
            <span>—</span>
          )}
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Pembayaran: </span>
          <strong>{formatRupiah(p.totalPaid)}</strong>
          <span className="text-[var(--text-muted)]"> dari {formatRupiah(p.totalValue)}</span>
        </div>
        <Link
          href={`/portal/proyek/${p.id}`}
          className="inline-block text-sm font-medium text-[var(--brand)] hover:underline"
        >
          Lihat detail →
        </Link>
      </CardContent>
    </Card>
  );
}
