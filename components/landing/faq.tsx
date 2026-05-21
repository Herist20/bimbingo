'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
  q: string;
  a: string;
}

export function Faq({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <li
            key={i}
            className={cn(
              'overflow-hidden rounded-xl border transition-colors',
              isOpen ? 'bg-[var(--bg-elevated)]' : 'bg-[var(--bg-base)] hover:bg-[var(--bg-elevated)]',
            )}
            style={{ borderColor: isOpen ? 'var(--border-strong)' : 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="mt-0.5 font-mono text-[11px] font-medium text-[var(--text-muted)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 font-display text-base font-medium text-[var(--text-display)]">
                {item.q}
              </span>
              <span
                className={cn(
                  'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[var(--text-secondary)] transition-transform',
                  isOpen ? 'rotate-45 border-[var(--brand)] text-[var(--brand)]' : '',
                )}
                style={{ borderColor: isOpen ? 'var(--brand)' : 'var(--border-strong)' }}
              >
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="border-t px-5 py-4 text-sm leading-relaxed text-[var(--text-secondary)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
