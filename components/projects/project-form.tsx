'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { ClientCombobox } from '@/components/clients/client-combobox';
import {
  DEFAULT_MILESTONES,
  PROJECT_TYPES,
  PROJECT_TYPE_LABEL,
  ProjectCreateSchema,
  type ProjectCreateInput,
} from '@/lib/schemas/project';
import { createProject } from '@/lib/actions/projects';
import type { ClientRow } from '@/lib/actions/clients';
import { cn } from '@/lib/utils';

interface ProjectFormProps {
  initialClient?: ClientRow | null;
}

export function ProjectForm({ initialClient }: ProjectFormProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [useDefaults, setUseDefaults] = React.useState(true);

  const form = useForm<ProjectCreateInput>({
    resolver: zodResolver(ProjectCreateSchema),
    defaultValues: {
      client_id: initialClient?.id ?? '',
      title: '',
      type: 'skripsi',
      description: '',
      total_value: 0,
      start_date: '',
      target_end_date: '',
      milestones: [],
      lecturers: [],
    },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const payload: ProjectCreateInput = {
        ...values,
        milestones: useDefaults ? DEFAULT_MILESTONES : [],
      };
      const result = await createProject(payload);
      if (!result.ok) {
        if (result.error.fields) {
          for (const [k, msgs] of Object.entries(result.error.fields)) {
            if (msgs?.[0]) {
              form.setError(k as keyof ProjectCreateInput, {
                type: 'server',
                message: msgs[0],
              });
            }
          }
        }
        toast.error(result.error.message);
        return;
      }
      toast.success('Proyek dibuat.');
      router.push(`/projects/${result.data.id}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Field
        label="Klien"
        required
        error={form.formState.errors.client_id?.message}
      >
        <Controller
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <ClientCombobox
              value={field.value}
              initialOption={initialClient}
              onChange={(c) => field.onChange(c?.id ?? '')}
            />
          )}
        />
      </Field>

      <section className="grid gap-4 md:grid-cols-2">
        <Field
          label="Judul proyek"
          htmlFor="title"
          required
          error={form.formState.errors.title?.message}
        >
          <Input
            id="title"
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register('title')}
          />
        </Field>
        <Field
          label="Tipe"
          htmlFor="type"
          error={form.formState.errors.type?.message}
        >
          <select
            id="type"
            {...form.register('type')}
            className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Total nilai (Rp)"
          htmlFor="total_value"
          hint="Tanpa pemisah ribuan (sistem akan format otomatis di tampilan)."
          error={form.formState.errors.total_value?.message}
        >
          <Input
            id="total_value"
            type="number"
            inputMode="numeric"
            min={0}
            {...form.register('total_value')}
          />
        </Field>
        <div />
        <Field
          label="Mulai"
          htmlFor="start_date"
          error={form.formState.errors.start_date?.message}
        >
          <Input id="start_date" type="date" {...form.register('start_date')} />
        </Field>
        <Field
          label="Target selesai"
          htmlFor="target_end_date"
          error={form.formState.errors.target_end_date?.message}
        >
          <Input id="target_end_date" type="date" {...form.register('target_end_date')} />
        </Field>
      </section>

      <Field
        label="Deskripsi"
        htmlFor="description"
        error={form.formState.errors.description?.message}
      >
        <textarea
          id="description"
          rows={4}
          className={cn(
            'flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)]',
            'border-[var(--border-strong)]',
          )}
          {...form.register('description')}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useDefaults}
          onChange={(e) => setUseDefaults(e.target.checked)}
          className="h-4 w-4 accent-[var(--brand)]"
        />
        Buat default 6 bab (Bab 1-5 + Sidang)
      </label>

      <div
        className="flex justify-end gap-2 border-t pt-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={pending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : 'Simpan proyek'}
        </Button>
      </div>
    </form>
  );
}
