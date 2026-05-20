'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { OptionsEditor } from './options-editor';
import {
  CF_FIELD_TYPES,
  CF_FIELD_TYPE_LABEL,
  type CFEntityType,
  type CFFieldType,
  type CFOption,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';
import { createCustomField, updateCustomField } from '@/lib/actions/custom-fields';

interface FieldEditorProps {
  entityType: CFEntityType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: CustomFieldRow | null;
  onSaved: (field: CustomFieldRow) => void;
}

export function FieldEditor({
  entityType,
  open,
  onOpenChange,
  editing,
  onSaved,
}: FieldEditorProps) {
  const [label, setLabel] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [fieldType, setFieldType] = React.useState<CFFieldType>('text');
  const [required, setRequired] = React.useState(false);
  const [showInForm, setShowInForm] = React.useState(true);
  const [showInList, setShowInList] = React.useState(true);
  const [options, setOptions] = React.useState<CFOption[]>([]);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setLabel(editing.label);
      setDescription(editing.description ?? '');
      setFieldType(editing.field_type);
      setRequired(editing.required);
      setShowInForm(editing.show_in_form);
      setShowInList(editing.show_in_list);
      setOptions(editing.options);
    } else {
      setLabel('');
      setDescription('');
      setFieldType('text');
      setRequired(false);
      setShowInForm(true);
      setShowInList(true);
      setOptions([]);
    }
  }, [open, editing]);

  const needsOptions = fieldType === 'select' || fieldType === 'multiselect';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    startTransition(async () => {
      if (editing) {
        const result = await updateCustomField(editing.id, {
          label,
          description,
          options,
          required,
          show_in_form: showInForm,
          show_in_list: showInList,
        });
        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
        toast.success('Field diperbarui.');
        onSaved(result.data);
        return;
      }

      const result = await createCustomField({
        entity_type: entityType,
        label,
        description,
        field_type: fieldType,
        options,
        required,
        show_in_form: showInForm,
        show_in_list: showInList,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Field ditambahkan.');
      onSaved(result.data);
    });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-6 shadow-xl"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="text-lg font-semibold">
            {editing ? 'Edit field' : 'Tambah field'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)]">
            {editing
              ? 'Tipe field tidak dapat diubah setelah ada data. Arsipkan & buat baru bila perlu.'
              : 'Field akan tampil di form CRUD dan (opsional) list view entitas ini.'}
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <Field label="Label" htmlFor="cf-label" required>
              <Input
                id="cf-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='Mis. "Asal Kampus"'
                autoFocus
              />
            </Field>
            <Field label="Deskripsi" htmlFor="cf-desc" hint="Bantuan singkat di form (opsional).">
              <Input
                id="cf-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field label="Tipe data" htmlFor="cf-type">
              <select
                id="cf-type"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as CFFieldType)}
                disabled={Boolean(editing)}
                className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm disabled:opacity-50"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {CF_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CF_FIELD_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>

            {needsOptions ? (
              <Field label="Opsi" hint="Minimal 1 opsi untuk tipe pilihan.">
                <OptionsEditor value={options} onChange={setOptions} />
              </Field>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Wajib diisi
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInForm}
                  onChange={(e) => setShowInForm(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Tampil di form
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInList}
                  onChange={(e) => setShowInList(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Tampil di list
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={pending || !label.trim()}>
                {pending ? 'Menyimpan…' : editing ? 'Perbarui' : 'Tambah'}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
