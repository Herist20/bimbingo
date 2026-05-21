import Link from 'next/link';
import { ArrowRight, History, Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listAuditLogs, type AuditLogRow } from '@/lib/actions/audit';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';

interface ProjectActivityCardProps {
  projectId: string;
  limit?: number;
}

const ACTION_LABEL: Record<string, string> = {
  status_change: 'Ubah status',
  insert: 'Tambah',
  update: 'Perbarui',
  delete: 'Hapus',
  archive: 'Arsipkan',
  restore: 'Pulihkan',
};

const ACTION_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  status_change: 'brand',
  insert: 'success',
  update: 'brand',
  delete: 'danger',
  archive: 'warning',
  restore: 'success',
};

function summarizeChange(row: AuditLogRow): string {
  if (row.action === 'status_change' && row.before_data && row.after_data) {
    const before = (row.before_data as Record<string, unknown>).status;
    const after = (row.after_data as Record<string, unknown>).status;
    if (before && after) return `${before} → ${after}`;
  }
  if (row.before_data && row.after_data) {
    const keys = Object.keys(row.after_data ?? {});
    if (keys.length === 1) return `Field ${keys[0]} berubah`;
    if (keys.length > 1) return `${keys.length} field berubah`;
  }
  return '';
}

export async function ProjectActivityCard({ projectId, limit = 6 }: ProjectActivityCardProps) {
  const result = await listAuditLogs({
    entity_type: 'project',
    entity_id: projectId,
    pageSize: limit,
    page: 1,
  });

  const rows = result.ok ? result.data.rows : [];
  const total = result.ok ? result.data.total : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--brand)]" />
            <CardTitle className="font-display text-base">Aktivitas</CardTitle>
          </div>
          {total > limit ? (
            <Link
              href={`/settings/audit-log?entity_type=project&entity_id=${projectId}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Lihat semua ({total})
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
        <CardDescription>
          Jejak perubahan otomatis dari trigger DB. Pakai untuk verifikasi siapa ubah apa kapan.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
              <History className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium text-[var(--text-primary)]">Belum ada aktivitas</p>
            <p className="max-w-sm text-xs text-[var(--text-muted)]">
              Saat ini perubahan status proyek ter-rekam otomatis. Trigger lain ditambahkan
              bertahap.
            </p>
          </div>
        ) : (
          <ol className="relative">
            {rows.map((row, idx) => (
              <TimelineItem key={row.id} row={row} isLast={idx === rows.length - 1} />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineItem({ row, isLast }: { row: AuditLogRow; isLast: boolean }) {
  const tone = ACTION_TONE[row.action] ?? 'neutral';
  const label = ACTION_LABEL[row.action] ?? row.action;
  const summary = summarizeChange(row);

  return (
    <li className="relative flex gap-3 px-5 py-3">
      {/* Rail */}
      {!isLast ? (
        <span
          aria-hidden
          className="absolute left-[26px] top-9 h-[calc(100%-1.5rem)] w-px bg-[var(--border)]"
        />
      ) : null}

      {/* Dot */}
      <span
        aria-hidden
        className="relative z-10 mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--bg-elevated)]"
        style={{
          borderColor:
            tone === 'success'
              ? 'var(--success)'
              : tone === 'warning'
                ? 'var(--warning)'
                : tone === 'danger'
                  ? 'var(--danger)'
                  : 'var(--brand)',
        }}
      />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{label}</Badge>
          {summary ? (
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">{summary}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>{formatTanggal(row.created_at, 'dd MMM yyyy HH:mm')}</span>
          <span aria-hidden>·</span>
          <span>{formatTanggalRelatif(row.created_at)}</span>
        </div>
      </div>
    </li>
  );
}
