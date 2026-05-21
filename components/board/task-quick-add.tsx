'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';
import { CustomFieldsSection } from '@/components/custom-fields/custom-fields-section';
import { createTask, type TaskRow } from '@/lib/actions/tasks';
import { TASK_STATUS_LABEL, type TaskStatus } from '@/lib/schemas/task';

interface TaskQuickAddProps {
  projectId: string;
  status: TaskStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (task: TaskRow) => void;
  customFields?: CustomFieldRow[];
}

export function TaskQuickAdd({
  projectId,
  status,
  open,
  onOpenChange,
  onCreated,
  customFields = [],
}: TaskQuickAddProps) {
  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [customData, setCustomData] = React.useState<Record<string, unknown>>({});
  const [customErrors, setCustomErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setDueDate('');
      setPriority('medium');
      setCustomData({});
      setCustomErrors({});
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCustomErrors({});
    startTransition(async () => {
      const result = await createTask({
        project_id: projectId,
        title: title.trim(),
        status,
        priority,
        due_date: dueDate,
        custom_data: customData,
      });
      if (!result.ok) {
        if (result.error.fields) {
          const cfKeys = new Set(customFields.map((f) => f.key));
          const cfErrs: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.error.fields)) {
            if (v?.[0] && cfKeys.has(k)) cfErrs[k] = v[0];
          }
          if (Object.keys(cfErrs).length) setCustomErrors(cfErrs);
        }
        toast.error(result.error.message);
        return;
      }
      toast.success('Task ditambahkan.');
      onCreated(result.data);
    });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-6 shadow-xl">
          <DialogPrimitive.Title className="text-lg font-semibold">
            Tambah task — {TASK_STATUS_LABEL[status]}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)]">
            Isi judul dulu, detail lain bisa di-edit nanti.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <Field label="Judul" htmlFor="quick-title" required>
              <Input
                id="quick-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bab 2 — Tinjauan Pustaka"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Deadline" htmlFor="quick-due">
                <Input
                  id="quick-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
              <Field label="Prioritas" htmlFor="quick-priority">
                <select
                  id="quick-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Mendesak</option>
                </select>
              </Field>
            </div>

            {customFields.length > 0 ? (
              <CustomFieldsSection
                fields={customFields}
                values={customData}
                onChange={setCustomData}
                errors={customErrors}
              />
            ) : null}

            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={pending || !title.trim()}>
                {pending ? 'Menyimpan…' : 'Tambah'}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
