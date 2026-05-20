'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { upsertMilestones } from '@/lib/actions/projects';
import {
  DEFAULT_MILESTONES,
  MILESTONE_STATUS_LABEL,
  MILESTONE_STATUSES,
  type MilestoneInput,
} from '@/lib/schemas/project';

interface MilestoneEditorProps {
  projectId: string;
  initial: Array<{
    id?: string;
    title: string;
    sequence: number;
    due_date: string | null;
    status: string;
    weight_percent: number | null;
    notes?: string | null;
  }>;
}

type Row = MilestoneInput & { _key: string };

export function MilestoneEditor({ projectId, initial }: MilestoneEditorProps) {
  const [rows, setRows] = React.useState<Row[]>(() =>
    initial
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((m, i) => ({
        _key: m.id ?? `existing-${i}`,
        id: m.id,
        title: m.title,
        sequence: m.sequence,
        due_date: m.due_date ?? '',
        status: m.status as MilestoneInput['status'],
        weight_percent: m.weight_percent ?? undefined,
        notes: m.notes ?? '',
      })),
  );
  const [pending, startTransition] = React.useTransition();

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  const remove = (key: string) =>
    setRows((prev) => prev.filter((r) => r._key !== key));

  const append = () => {
    const nextSeq = (rows.reduce((m, r) => Math.max(m, Number(r.sequence) || 0), 0) || 0) + 1;
    setRows((prev) => [
      ...prev,
      {
        _key: `new-${crypto.randomUUID()}`,
        title: `Bab ${nextSeq}`,
        sequence: nextSeq,
        due_date: '',
        status: 'not-started',
        weight_percent: undefined,
      },
    ]);
  };

  const loadDefaults = () => {
    if (rows.length > 0) {
      const ok = window.confirm('Mengganti semua bab dengan default. Lanjut?');
      if (!ok) return;
    }
    setRows(
      DEFAULT_MILESTONES.map((m, i) => ({
        _key: `default-${i}`,
        title: m.title,
        sequence: m.sequence,
        due_date: '',
        status: 'not-started',
        weight_percent: m.weight_percent,
      })),
    );
  };

  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight_percent) || 0), 0);

  const save = () => {
    startTransition(async () => {
      const payload = rows.map((r) => ({
        id: r.id,
        title: r.title,
        sequence: Number(r.sequence),
        due_date: r.due_date || undefined,
        weight_percent: r.weight_percent,
        status: r.status,
        notes: r.notes,
      }));
      const result = await upsertMilestones(projectId, payload);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`${result.data.count} bab tersimpan.`);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--text-secondary)]">
          Total weight: <strong>{totalWeight}%</strong>
          {totalWeight > 100 ? (
            <span className="ml-2 text-[var(--danger)]">Melebihi 100%</span>
          ) : null}
        </p>
        <div className="flex gap-2">
          {rows.length === 0 ? (
            <Button type="button" variant="secondary" size="sm" onClick={loadDefaults}>
              Pakai default 6 bab
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={append}>
            <Plus className="h-4 w-4" />
            Tambah bab
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <div
            className="rounded-md border border-dashed p-6 text-center text-sm text-[var(--text-muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Belum ada bab. Tambah manual atau pakai default 6 bab (Bab 1-5 + Sidang).
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row._key}
              className="grid gap-2 rounded-md border p-3 sm:grid-cols-[60px_minmax(0,1fr)_140px_120px_140px_40px]"
              style={{ borderColor: 'var(--border)' }}
            >
              <Field label="No" htmlFor={`seq-${row._key}`}>
                <Input
                  id={`seq-${row._key}`}
                  type="number"
                  min={1}
                  max={50}
                  value={row.sequence}
                  onChange={(e) => update(row._key, { sequence: Number(e.target.value) })}
                />
              </Field>
              <Field label="Judul bab" htmlFor={`title-${row._key}`}>
                <Input
                  id={`title-${row._key}`}
                  value={row.title}
                  onChange={(e) => update(row._key, { title: e.target.value })}
                />
              </Field>
              <Field label="Deadline" htmlFor={`due-${row._key}`}>
                <Input
                  id={`due-${row._key}`}
                  type="date"
                  value={row.due_date ?? ''}
                  onChange={(e) => update(row._key, { due_date: e.target.value })}
                />
              </Field>
              <Field label="Weight %" htmlFor={`w-${row._key}`}>
                <Input
                  id={`w-${row._key}`}
                  type="number"
                  min={0}
                  max={100}
                  value={row.weight_percent ?? ''}
                  onChange={(e) =>
                    update(row._key, {
                      weight_percent: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Status" htmlFor={`status-${row._key}`}>
                <select
                  id={`status-${row._key}`}
                  value={row.status ?? 'not-started'}
                  onChange={(e) =>
                    update(row._key, { status: e.target.value as MilestoneInput['status'] })
                  }
                  className="h-10 rounded-md border bg-[var(--bg-base)] px-2 text-sm"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  {MILESTONE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {MILESTONE_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus ${row.title}`}
                  onClick={() => remove(row._key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        className="flex justify-end gap-2 border-t pt-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? 'Menyimpan…' : 'Simpan bab'}
        </Button>
      </div>
    </div>
  );
}
