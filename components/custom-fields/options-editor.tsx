'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CF_OPTION_TONES, type CFOption, type CFOptionTone } from '@/lib/schemas/custom-field';

interface OptionsEditorProps {
  value: CFOption[];
  onChange: (next: CFOption[]) => void;
  disabled?: boolean;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

export function OptionsEditor({ value, onChange, disabled }: OptionsEditorProps) {
  function update(idx: number, patch: Partial<CFOption>) {
    onChange(value.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function append() {
    const nextLabel = `Opsi ${value.length + 1}`;
    onChange([...value, { value: slugify(nextLabel), label: nextLabel, color: 'neutral' }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
          Belum ada opsi. Klik &quot;Tambah opsi&quot;.
        </p>
      ) : (
        value.map((opt, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-md border p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_40px]"
            style={{ borderColor: 'var(--border)' }}
          >
            <Input
              aria-label="Label opsi"
              value={opt.label}
              onChange={(e) => {
                const label = e.target.value;
                update(i, {
                  label,
                  // auto sync key bila masih sama dengan slug label sebelumnya
                  value: slugify(label) === slugify(opt.label) ? slugify(label) : opt.value,
                });
              }}
              disabled={disabled}
              placeholder="Label tampilan"
            />
            <Input
              aria-label="Value opsi (machine)"
              value={opt.value}
              onChange={(e) => update(i, { value: slugify(e.target.value) })}
              disabled={disabled}
              className="font-mono text-xs"
              placeholder="value_internal"
            />
            <select
              aria-label="Warna"
              value={opt.color ?? 'neutral'}
              onChange={(e) => update(i, { color: e.target.value as CFOptionTone })}
              className="h-10 rounded-md border bg-[var(--bg-base)] px-2 text-sm"
              style={{ borderColor: 'var(--border-strong)' }}
              disabled={disabled}
            >
              {CF_OPTION_TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Hapus opsi"
              onClick={() => remove(i)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button type="button" variant="secondary" size="sm" onClick={append} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Tambah opsi
      </Button>
    </div>
  );
}
