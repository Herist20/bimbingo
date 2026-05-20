'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  CLIENT_FORM_DEFAULTS,
  ClientCreateSchema,
  type ClientCreateInput,
} from '@/lib/schemas/client';
import { createClient, updateClient } from '@/lib/actions/clients';
import { cn } from '@/lib/utils';

interface ClientFormProps {
  mode: 'create' | 'edit';
  clientId?: string;
  initialValues?: Partial<ClientCreateInput>;
}

export function ClientForm({ mode, clientId, initialValues }: ClientFormProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const form = useForm<ClientCreateInput>({
    resolver: zodResolver(ClientCreateSchema),
    defaultValues: { ...CLIENT_FORM_DEFAULTS, ...initialValues },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createClient(values)
          : await updateClient(clientId!, values);

      if (!result.ok) {
        if (result.error.fields) {
          for (const [key, msgs] of Object.entries(result.error.fields)) {
            if (msgs?.[0]) {
              form.setError(key as keyof ClientCreateInput, {
                type: 'server',
                message: msgs[0],
              });
            }
          }
        }
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === 'create' ? 'Klien berhasil ditambahkan.' : 'Klien berhasil diperbarui.',
      );
      router.push(`/clients/${result.data.id}`);
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
          label="Panggilan"
          htmlFor="nickname"
          error={form.formState.errors.nickname?.message}
        >
          <Input id="nickname" {...form.register('nickname')} />
        </Field>

        <Field
          label="WhatsApp"
          htmlFor="whatsapp"
          required
          hint="Contoh: 08123456789 atau +6281234567890"
          error={form.formState.errors.whatsapp?.message}
        >
          <Input
            id="whatsapp"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(form.formState.errors.whatsapp)}
            {...form.register('whatsapp')}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register('email')}
          />
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
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
          label="Jurusan"
          htmlFor="major"
          error={form.formState.errors.major?.message}
        >
          <Input id="major" {...form.register('major')} />
        </Field>
        <Field
          label="NIM"
          htmlFor="student_id"
          error={form.formState.errors.student_id?.message}
        >
          <Input id="student_id" {...form.register('student_id')} />
        </Field>
        <Field
          label="Semester"
          htmlFor="semester"
          error={form.formState.errors.semester?.message}
        >
          <Input
            id="semester"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            {...form.register('semester')}
          />
        </Field>
        <Field
          label="Target sidang"
          htmlFor="target_defense"
          hint="Format YYYY-MM-DD"
          error={form.formState.errors.target_defense?.message}
        >
          <Input id="target_defense" type="date" {...form.register('target_defense')} />
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Field
          label="Sumber"
          htmlFor="source"
          hint="Dari mana klien tahu jasa Anda (IG, TikTok, referral, dll)"
          error={form.formState.errors.source?.message}
        >
          <Input id="source" {...form.register('source')} />
        </Field>
      </section>

      <Field
        label="Catatan"
        htmlFor="notes"
        error={form.formState.errors.notes?.message}
      >
        <textarea
          id="notes"
          rows={4}
          className={cn(
            'flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)]',
            'border-[var(--border-strong)] aria-invalid:border-[var(--danger)]',
          )}
          {...form.register('notes')}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={pending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : mode === 'create' ? 'Simpan klien' : 'Perbarui klien'}
        </Button>
      </div>
    </form>
  );
}
