import type * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col gap-2">
        {kicker ? (
          <span className="inline-flex w-fit items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
            />
            {kicker}
          </span>
        ) : null}
        <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-[var(--text-display)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
