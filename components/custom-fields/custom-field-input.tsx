'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';

interface CustomFieldInputProps {
  field: CustomFieldRow;
  value: unknown;
  onChange: (next: unknown) => void;
  id?: string;
  disabled?: boolean;
}

const textareaCn =
  'flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)] border-[var(--border-strong)]';

const selectCn =
  'h-10 w-full rounded-md border bg-[var(--bg-base)] px-3 text-sm border-[var(--border-strong)]';

export function CustomFieldInput({
  field,
  value,
  onChange,
  id,
  disabled,
}: CustomFieldInputProps) {
  const inputId = id ?? `cf-${field.key}`;
  const ariaInvalid = field.required && (value === undefined || value === null || value === '');

  switch (field.field_type) {
    case 'long_text':
      return (
        <textarea
          id={inputId}
          rows={4}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={cn(textareaCn)}
          aria-invalid={ariaInvalid}
        />
      );
    case 'number':
    case 'currency':
    case 'percent':
      return (
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          step={field.field_type === 'currency' || field.field_type === 'percent' ? 1 : 'any'}
          min={field.field_type === 'percent' ? 0 : undefined}
          max={field.field_type === 'percent' ? 100 : undefined}
          disabled={disabled}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return onChange(undefined);
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          aria-invalid={ariaInvalid}
        />
      );
    case 'date':
      return (
        <Input
          id={inputId}
          type="date"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={ariaInvalid}
        />
      );
    case 'datetime':
      return (
        <Input
          id={inputId}
          type="datetime-local"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={ariaInvalid}
        />
      );
    case 'boolean':
      return (
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Ya
        </label>
      );
    case 'select':
      return (
        <select
          id={inputId}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={selectCn}
          aria-invalid={ariaInvalid}
        >
          <option value="">— pilih —</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => {
            const checked = arr.includes(o.value);
            return (
              <label
                key={o.value}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
                  checked
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'border-[var(--border-strong)]',
                )}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  disabled={disabled}
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...arr, o.value]
                      : arr.filter((v) => v !== o.value);
                    onChange(next.length ? next : undefined);
                  }}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      );
    }
    case 'url':
      return (
        <Input
          id={inputId}
          type="url"
          inputMode="url"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={ariaInvalid}
        />
      );
    case 'email':
      return (
        <Input
          id={inputId}
          type="email"
          inputMode="email"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={ariaInvalid}
        />
      );
    case 'phone':
      return (
        <Input
          id={inputId}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={ariaInvalid}
        />
      );
    case 'user_ref':
    case 'text':
    default:
      return (
        <Input
          id={inputId}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={ariaInvalid}
        />
      );
  }
}
