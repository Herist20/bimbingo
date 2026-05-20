'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  id?: string;
  'aria-invalid'?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Tambah tag lalu Enter',
  max = 10,
  className,
  id,
  ...rest
}: TagInputProps) {
  const [draft, setDraft] = React.useState('');

  function add(label: string) {
    const v = label.trim();
    if (!v) return;
    if (value.includes(v)) return;
    if (value.length >= max) return;
    onChange([...value, v]);
    setDraft('');
  }

  function remove(label: string) {
    onChange(value.filter((t) => t !== label));
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border bg-[var(--bg-base)] px-2 py-1.5 focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:ring-offset-2 ring-offset-[var(--bg-base)]',
        'border-[var(--border-strong)] aria-invalid:border-[var(--danger)]',
        className,
      )}
      aria-invalid={rest['aria-invalid']}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Hapus tag ${tag}`}
            className="rounded-full p-0.5 hover:bg-[var(--bg-muted)]"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            remove(value[value.length - 1]!);
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[8ch] bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
      />
    </div>
  );
}
