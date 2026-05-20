'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  LECTURER_FORM_DEFAULTS,
  LecturerCreateSchema,
  type LecturerCreateInput,
} from '@/lib/schemas/lecturer';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';
import { CustomFieldsSection } from '@/components/custom-fields/custom-fields-section';
import { createLecturer, updateLecturer } from '@/lib/actions/lecturers';
import { cn } from '@/lib/utils';
import { TagInput } from './tag-input';

interface LecturerFormProps {
  mode: 'create' | 'edit';
  lecturerId?: string;
  initialValues?: Partial<LecturerCreateInput>;
  customFields?: CustomFieldRow[];
  initialCustomData?: Record<string, unknown>;
  /**
   * Saat dipakai inline (di combobox), redirect tidak diperlukan.
   * Override perilaku setelah submit sukses.
   */
  onCreated?: (created: { id: string }) => void;
  hideCancel?: boolean;
}

export function LecturerForm({
  mode,
  lecturerId,
  initialValues,
  customFields = [],
  initialCustomData = {},
  onCreated,
  hideCancel,
}: LecturerFormProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [customData, setCustomData] = React.useState<Record<string, unknown>>(initialCustomData);
  const [customErrors, setCustomErrors] = React.useState<Record<string, string>>({});

  const form = useForm<LecturerCreateInput>({
    resolver: zodResolver(LecturerCreateSchema),
    defaultValues: { ...LECTURER_FORM_DEFAULTS, ...initialValues },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit((values) => {
    setCustomErrors({});
    startTransition(async () => {
      const payload = { ...values, custom_data: customData };
      const result =
        mode === 'create'
          ? await createLecturer(payload)
          : await updateLecturer(lecturerId!, payload);

      if (!result.ok) {
        if (result.error.fields) {
          const cfKeys = new Set(customFields.map((f) => f.key));
          const cfErrs: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.error.fields)) {
            if (!msgs?.[0]) continue;
            if (cfKeys.has(key)) {
              cfErrs[key] = msgs[0];
            } else {
              form.setError(key as keyof LecturerCreateInput, {
                type: 'server',
                message: msgs[0],
              });
            }
          }
          if (Object.keys(cfErrs).length) setCustomErrors(cfErrs);
        }
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === 'create' ? 'Dosen berhasil ditambahkan.' : 'Dosen berhasil diperbarui.',
      );

      if (mode === 'create' && onCreated && 'id' in result.data) {
        onCreated({ id: result.data.id });
        return;
      }

      const id = mode === 'edit' ? lecturerId! : (result.data as { id: string }).id;
      router.push(`/lecturers/${id}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nama lengkap"
          htmlFor="full_name"
          required
          error={form.formState.errors.full_name?.message}
        >
          <Input
            id="full_name"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.full_name)}
            {...form.register('full_name')}
          />
        </Field>
        <Field
          label="Gelar"
          htmlFor="title"
          hint='Contoh: "Dr.", "Prof. Dr.", "M.Si."'
          error={form.formState.errors.title?.message}
        >
          <Input id="title" {...form.register('title')} />
        </Field>
        <Field
          label="Kampus"
          htmlFor="university"
          error={form.formState.errors.university?.message}
        >
          <Input id="university" {...form.register('university')} />
        </Field>
        <Field
          label="Fakultas"
          htmlFor="faculty"
          error={form.formState.errors.faculty?.message}
        >
          <Input id="faculty" {...form.register('faculty')} />
        </Field>
        <Field
          label="Email"
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <Input id="email" type="email" {...form.register('email')} />
        </Field>
        <Field
          label="WhatsApp"
          htmlFor="whatsapp"
          error={form.formState.errors.whatsapp?.message}
        >
          <Input id="whatsapp" inputMode="tel" {...form.register('whatsapp')} />
        </Field>
      </section>

      <Field
        label="Tag"
        htmlFor="tags"
        hint='Contoh: "killer", "responsif", "detail". Tekan Enter setiap tag.'
        error={(form.formState.errors.tags as { message?: string } | undefined)?.message}
      >
        <Controller
          control={form.control}
          name="tags"
          render={({ field }) => (
            <TagInput
              id="tags"
              value={field.value ?? []}
              onChange={field.onChange}
              max={10}
            />
          )}
        />
      </Field>

      <Field
        label="Catatan karakteristik"
        htmlFor="characteristics"
        hint="Gaya revisi, jam respon, hal yang harus dihindari, dll."
        error={form.formState.errors.characteristics?.message}
      >
        <textarea
          id="characteristics"
          rows={4}
          className={cn(
            'flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)]',
            'border-[var(--border-strong)] aria-invalid:border-[var(--danger)]',
          )}
          {...form.register('characteristics')}
        />
      </Field>

      {customFields.length > 0 ? (
        <CustomFieldsSection
          fields={customFields}
          values={customData}
          onChange={setCustomData}
          errors={customErrors}
        />
      ) : null}

      <div
        className="flex justify-end gap-2 border-t pt-4"
        style={{ borderColor: 'var(--border)' }}
      >
        {hideCancel ? null : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={pending}
          >
            Batal
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : mode === 'create' ? 'Simpan dosen' : 'Perbarui dosen'}
        </Button>
      </div>
    </form>
  );
}
