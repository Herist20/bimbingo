'use client';

import * as React from 'react';
import { Archive, ArchiveRestore, MoveDown, MoveUp, PencilLine, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldEditor } from './field-editor';
import {
  archiveCustomField,
  reorderCustomFields,
  restoreCustomField,
} from '@/lib/actions/custom-fields';
import {
  CF_FIELD_TYPE_LABEL,
  type CFEntityType,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';

interface FieldsManagerProps {
  entityType: CFEntityType;
  initial: CustomFieldRow[];
}

export function FieldsManager({ entityType, initial }: FieldsManagerProps) {
  const [fields, setFields] = React.useState<CustomFieldRow[]>(initial);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomFieldRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(field: CustomFieldRow) {
    setEditing(field);
    setEditorOpen(true);
  }

  function handleSaved(field: CustomFieldRow) {
    setFields((prev) => {
      const exists = prev.some((p) => p.id === field.id);
      return exists
        ? prev.map((p) => (p.id === field.id ? field : p))
        : [...prev, field];
    });
    setEditorOpen(false);
  }

  function handleArchive(field: CustomFieldRow) {
    startTransition(async () => {
      const action = field.archived_at ? restoreCustomField : archiveCustomField;
      const result = await action(field.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setFields((prev) =>
        prev.map((p) =>
          p.id === field.id
            ? { ...p, archived_at: field.archived_at ? null : new Date().toISOString() }
            : p,
        ),
      );
      toast.success(field.archived_at ? 'Field dipulihkan.' : 'Field diarsipkan.');
    });
  }

  function move(field: CustomFieldRow, dir: 'up' | 'down') {
    const idx = fields.findIndex((f) => f.id === field.id);
    if (idx === -1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= fields.length) return;
    const next = fields.slice();
    const swap = next[swapIdx]!;
    next[swapIdx] = next[idx]!;
    next[idx] = swap;
    setFields(next);
    startTransition(async () => {
      const result = await reorderCustomFields(
        entityType,
        next.map((f) => f.id),
      );
      if (!result.ok) {
        toast.error(result.error.message);
        setFields(fields);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {fields.filter((f) => !f.archived_at).length} field aktif ·{' '}
          {fields.filter((f) => f.archived_at).length} arsip
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah field
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Label</th>
              <th className="px-4 py-2 font-medium">Key</th>
              <th className="px-4 py-2 font-medium">Tipe</th>
              <th className="px-4 py-2 font-medium">Visibility</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                  Belum ada custom field. Klik &quot;Tambah field&quot;.
                </td>
              </tr>
            ) : (
              fields.map((field, idx) => (
                <tr
                  key={field.id}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required ? (
                        <span className="text-[10px] text-[var(--danger)]">wajib</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs">
                      {field.key}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    {CF_FIELD_TYPE_LABEL[field.field_type]}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-[var(--text-secondary)]">
                    <div className="flex flex-wrap gap-1">
                      {field.show_in_form ? <Badge tone="neutral">Form</Badge> : null}
                      {field.show_in_list ? <Badge tone="neutral">List</Badge> : null}
                      {field.show_in_card ? <Badge tone="neutral">Card</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {field.archived_at ? (
                      <Badge tone="neutral">Arsip</Badge>
                    ) : (
                      <Badge tone="brand">Aktif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Naikkan urutan"
                        onClick={() => move(field, 'up')}
                        disabled={pending || idx === 0 || Boolean(field.archived_at)}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Turunkan urutan"
                        onClick={() => move(field, 'down')}
                        disabled={pending || idx === fields.length - 1 || Boolean(field.archived_at)}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Edit field"
                        onClick={() => openEdit(field)}
                        disabled={pending}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={field.archived_at ? 'Pulihkan' : 'Arsipkan'}
                        onClick={() => handleArchive(field)}
                        disabled={pending}
                      >
                        {field.archived_at ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FieldEditor
        entityType={entityType}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
