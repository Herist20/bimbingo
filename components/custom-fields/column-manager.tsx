'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  MoveDown,
  MoveUp,
  PencilLine,
  Plus,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export interface BuiltinColumnSpec {
  key: string;
  label: string;
  toggleable?: boolean; // default true
}

interface ColumnManagerProps {
  entityType: CFEntityType;
  scopeRef?: string | null;
  builtinColumns: BuiltinColumnSpec[];
  customFields: CustomFieldRow[];
  onCustomFieldsChange: (next: CustomFieldRow[]) => void;
  columnVisibility: Record<string, boolean>;
  onToggleColumn: (key: string, next?: boolean) => void;
  triggerLabel?: string;
}

export function ColumnManager({
  entityType,
  scopeRef,
  builtinColumns,
  customFields,
  onCustomFieldsChange,
  columnVisibility,
  onToggleColumn,
  triggerLabel = 'Kelola kolom',
}: ColumnManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomFieldRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(f: CustomFieldRow) {
    setEditing(f);
    setEditorOpen(true);
  }

  function handleSaved(f: CustomFieldRow) {
    const exists = customFields.some((c) => c.id === f.id);
    const next = exists
      ? customFields.map((c) => (c.id === f.id ? f : c))
      : [...customFields, f];
    onCustomFieldsChange(next);
    setEditorOpen(false);
  }

  function handleArchive(f: CustomFieldRow) {
    startTransition(async () => {
      const action = f.archived_at ? restoreCustomField : archiveCustomField;
      const result = await action(f.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      onCustomFieldsChange(
        customFields.map((c) =>
          c.id === f.id
            ? { ...c, archived_at: f.archived_at ? null : new Date().toISOString() }
            : c,
        ),
      );
      toast.success(f.archived_at ? 'Field dipulihkan.' : 'Field diarsipkan.');
    });
  }

  function move(f: CustomFieldRow, dir: 'up' | 'down') {
    const idx = customFields.findIndex((c) => c.id === f.id);
    if (idx === -1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= customFields.length) return;
    const next = customFields.slice();
    const tmp = next[swapIdx]!;
    next[swapIdx] = next[idx]!;
    next[idx] = tmp;
    onCustomFieldsChange(next);
    startTransition(async () => {
      const result = await reorderCustomFields(
        entityType,
        next.map((c) => c.id),
      );
      if (!result.ok) {
        toast.error(result.error.message);
        onCustomFieldsChange(customFields);
      }
    });
  }

  const activeCustom = customFields.filter((c) => !c.archived_at);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Settings2 className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-6 shadow-xl"
            aria-describedby={undefined}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold">
                  Kelola kolom
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)]">
                  Atur kolom bawaan & custom field yang tampil di tabel.
                </DialogPrimitive.Description>
              </div>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Tambah field
              </Button>
            </div>

            <section className="mt-6 flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Kolom bawaan
              </h3>
              <div className="flex flex-col gap-1.5">
                {builtinColumns.map((c) => {
                  const isVisible = columnVisibility[c.key] !== false;
                  const toggleable = c.toggleable !== false;
                  return (
                    <div
                      key={c.key}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <span>{c.label}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Toggle ${c.label}`}
                        disabled={!toggleable}
                        onClick={() => onToggleColumn(c.key)}
                      >
                        {isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Custom field
              </h3>
              {customFields.length === 0 ? (
                <p
                  className="rounded-md border border-dashed p-4 text-center text-xs text-[var(--text-muted)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Belum ada custom field. Klik &quot;Tambah field&quot;.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {customFields.map((f, idx) => {
                    const colKey = `cf:${f.key}`;
                    const isVisible = columnVisibility[colKey] !== false;
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate">{f.label}</span>
                          <Badge tone="neutral">{CF_FIELD_TYPE_LABEL[f.field_type]}</Badge>
                          {f.archived_at ? <Badge tone="neutral">Arsip</Badge> : null}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Naik"
                            onClick={() => move(f, 'up')}
                            disabled={pending || idx === 0 || Boolean(f.archived_at)}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Turun"
                            onClick={() => move(f, 'down')}
                            disabled={pending || idx === customFields.length - 1 || Boolean(f.archived_at)}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => openEdit(f)}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={f.archived_at ? 'Pulihkan' : 'Arsipkan'}
                            onClick={() => handleArchive(f)}
                            disabled={pending}
                          >
                            {f.archived_at ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Tampil di tabel: ${isVisible ? 'ya' : 'tidak'}`}
                            onClick={() => onToggleColumn(colKey)}
                            disabled={Boolean(f.archived_at)}
                          >
                            {isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {activeCustom.length} field aktif · pengaturan visibilitas disimpan per browser.
            </p>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <FieldEditor
        entityType={entityType}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        onSaved={handleSaved}
        scopeRef={scopeRef ?? null}
        scopeRefLabel="Hanya untuk konteks ini (mis. proyek saat ini)"
      />
    </>
  );
}
