'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Eye,
  EyeOff,
  Filter,
  History,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatTanggal } from '@/lib/format';
import type { AuditLogPayload, AuditLogRow } from '@/lib/actions/audit';

interface AuditListProps {
  initial: AuditLogPayload;
  initialFilter: {
    entity_type?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
  };
}

const ENTITY_LABEL: Record<string, string> = {
  project: 'Proyek',
  client: 'Klien',
  task: 'Task',
  lecturer: 'Dosen',
  payment: 'Pembayaran',
};

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

export function AuditList({ initial, initialFilter }: AuditListProps) {
  const router = useRouter();
  const [entityType, setEntityType] = React.useState(initialFilter.entity_type ?? '');
  const [action, setAction] = React.useState(initialFilter.action ?? '');
  const [fromDate, setFromDate] = React.useState(initialFilter.from ?? '');
  const [toDate, setToDate] = React.useState(initialFilter.to ?? '');
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  function applyFilter() {
    const params = new URLSearchParams();
    if (entityType) params.set('entity_type', entityType);
    if (action) params.set('action', action);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    params.set('page', '1');
    router.push(`/settings/audit-log?${params.toString()}`);
  }

  function clearFilter() {
    setEntityType('');
    setAction('');
    setFromDate('');
    setToDate('');
    router.push('/settings/audit-log');
  }

  function gotoPage(p: number) {
    const params = new URLSearchParams();
    if (entityType) params.set('entity_type', entityType);
    if (action) params.set('action', action);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    params.set('page', String(p));
    router.push(`/settings/audit-log?${params.toString()}`);
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasFilter = Boolean(entityType || action || fromDate || toDate);
  const totalPages = Math.max(1, Math.ceil(initial.total / initial.pageSize));

  return (
    <div className="flex flex-col gap-4">
      {/* Filter strip */}
      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Entitas
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <option value="">Semua</option>
              {initial.entityTypes.map((t) => (
                <option key={t} value={t}>
                  {ENTITY_LABEL[t] ?? t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Tindakan
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <option value="">Semua</option>
              {initial.actions.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABEL[a] ?? a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Dari
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Sampai
            </label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={applyFilter} className="flex-1">
              <Filter className="h-4 w-4" />
              Terapkan
            </Button>
            {hasFilter ? (
              <Button type="button" variant="ghost" size="icon" onClick={clearFilter} aria-label="Bersihkan filter">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          {initial.total} entry · halaman {initial.page} / {totalPages}
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          Trigger DB · audit_logs
        </span>
      </div>

      {/* List */}
      {initial.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
              <History className="h-5 w-5" />
            </span>
            <p className="font-display text-sm font-semibold">Belum ada audit entry</p>
            <p className="max-w-sm text-xs text-[var(--text-muted)]">
              Saat ini trigger audit aktif untuk perubahan status proyek. Trigger lain
              ditambahkan bertahap.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {initial.rows.map((row) => (
            <AuditEntry
              key={row.id}
              row={row}
              expanded={expanded.has(row.id)}
              onToggle={() => toggleExpand(row.id)}
            />
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">
            {(initial.page - 1) * initial.pageSize + 1} -{' '}
            {Math.min(initial.page * initial.pageSize, initial.total)} dari {initial.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => gotoPage(initial.page - 1)}
              disabled={initial.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => gotoPage(initial.page + 1)}
              disabled={initial.page >= totalPages}
            >
              Berikutnya
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AuditEntry({
  row,
  expanded,
  onToggle,
}: {
  row: AuditLogRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const action = ACTION_LABEL[row.action] ?? row.action;
  const tone = ACTION_TONE[row.action] ?? 'neutral';
  const entity = ENTITY_LABEL[row.entity_type] ?? row.entity_type;
  const hasDiff = row.before_data || row.after_data;
  const detailHref = row.entity_type === 'project' ? `/projects/${row.entity_id}` : null;

  return (
    <li
      className="overflow-hidden rounded-lg border bg-[var(--bg-elevated)] transition-colors"
      style={{ borderColor: expanded ? 'var(--border-strong)' : 'var(--border)' }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 inline-flex h-6 items-center rounded-full px-2 text-[10px] font-medium uppercase tracking-wider"
          style={{
            backgroundColor: `var(--${tone === 'neutral' ? 'bg-muted' : `${tone}-soft`})`,
            color: `var(--${tone === 'neutral' ? 'text-muted' : tone === 'brand' ? 'brand-ink' : tone})`,
          }}
        >
          <Badge tone={tone}>{action}</Badge>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {row.entity_label ?? entity}
            </span>
            <span className="font-mono text-[9px] text-[var(--text-muted)]">
              {row.entity_id.slice(0, 8)}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            {entity} · {formatTanggal(row.created_at, 'dd MMM yyyy HH:mm')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {detailHref ? (
            <Link
              href={detailHref}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            >
              Buka
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
          {hasDiff ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              aria-expanded={expanded}
            >
              {expanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {expanded ? 'Tutup' : 'Diff'}
            </button>
          ) : null}
        </div>
      </div>

      {expanded && hasDiff ? (
        <div
          className="grid gap-2 border-t bg-[var(--bg-subtle)] p-4 sm:grid-cols-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <DiffBlock label="Sebelum" data={row.before_data} tone="muted" />
          <DiffBlock label="Sesudah" data={row.after_data} tone="brand" />
        </div>
      ) : null}
    </li>
  );
}

function DiffBlock({
  label,
  data,
  tone,
}: {
  label: string;
  data: Record<string, unknown> | null;
  tone: 'muted' | 'brand';
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-[0.12em]',
          tone === 'brand' ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]',
        )}
      >
        {label}
      </span>
      <pre
        className="overflow-x-auto rounded-md border bg-[var(--bg-base)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text-primary)]"
        style={{ borderColor: 'var(--border)' }}
      >
        {data ? JSON.stringify(data, null, 2) : <span className="text-[var(--text-muted)]">—</span>}
      </pre>
    </div>
  );
}
