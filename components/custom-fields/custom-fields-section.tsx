'use client';

import * as React from 'react';
import { Field } from '@/components/ui/field';
import { CustomFieldInput } from './custom-field-input';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';

interface CustomFieldsSectionProps {
  fields: CustomFieldRow[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string | undefined>;
}

export function CustomFieldsSection({
  fields,
  values,
  onChange,
  errors,
}: CustomFieldsSectionProps) {
  const visible = fields.filter((f) => f.show_in_form);
  if (visible.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Field tambahan</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Kolom kustom yang Anda buat di Pengaturan → Custom Fields.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((field) => (
          <Field
            key={field.id}
            label={field.label}
            htmlFor={`cf-${field.key}`}
            required={field.required}
            hint={field.description ?? undefined}
            error={errors?.[field.key]}
          >
            <CustomFieldInput
              field={field}
              value={values[field.key]}
              onChange={(v) => onChange({ ...values, [field.key]: v })}
            />
          </Field>
        ))}
      </div>
    </section>
  );
}
