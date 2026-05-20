'use client';

import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CFOptionTone, CustomFieldRow } from '@/lib/schemas/custom-field';
import { formatRupiah, formatTanggal } from '@/lib/format';

interface CustomFieldCellProps {
  field: CustomFieldRow;
  value: unknown;
}

const TONE_MAP: Record<CFOptionTone, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  neutral: 'neutral',
  brand: 'brand',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

function findOption(field: CustomFieldRow, value: string) {
  return field.options.find((o) => o.value === value);
}

export function CustomFieldCell({ field, value }: CustomFieldCellProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }

  switch (field.field_type) {
    case 'boolean':
      return value ? (
        <Check className="h-4 w-4 text-[var(--success)]" />
      ) : (
        <X className="h-4 w-4 text-[var(--text-muted)]" />
      );

    case 'select': {
      const opt = findOption(field, String(value));
      return <Badge tone={TONE_MAP[opt?.color ?? 'neutral']}>{opt?.label ?? String(value)}</Badge>;
    }

    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      if (arr.length === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((v) => {
            const opt = findOption(field, v);
            return (
              <Badge key={v} tone={TONE_MAP[opt?.color ?? 'neutral']}>
                {opt?.label ?? v}
              </Badge>
            );
          })}
        </div>
      );
    }

    case 'currency':
      return <span className="text-sm">{formatRupiah(Number(value))}</span>;

    case 'percent':
      return <span className="text-sm">{Number(value)}%</span>;

    case 'date':
    case 'datetime':
      return <span className="text-sm">{formatTanggal(String(value))}</span>;

    case 'url':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[var(--brand)] hover:underline"
        >
          {String(value)}
        </a>
      );

    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-sm hover:underline">
          {String(value)}
        </a>
      );

    case 'phone':
      return <span className="font-mono text-xs">{String(value)}</span>;

    case 'number':
      return <span className="text-sm">{Number(value).toLocaleString('id-ID')}</span>;

    case 'long_text':
      return (
        <span className="line-clamp-2 text-sm" title={String(value)}>
          {String(value)}
        </span>
      );

    case 'text':
    case 'user_ref':
    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}
