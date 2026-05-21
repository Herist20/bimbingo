import type * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  steps?: Array<{ label: string; description?: string }>;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  steps,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const compact = variant === 'compact';
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-[var(--bg-elevated)] text-center',
        compact ? 'p-6' : 'p-8 sm:p-10',
        className,
      )}
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, var(--brand-soft) 0%, transparent 45%), radial-gradient(circle at 90% 100%, var(--accent-soft) 0%, transparent 45%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <span
            aria-hidden
            className="absolute -inset-3 rounded-2xl"
            style={{
              background:
                'conic-gradient(from 220deg at 50% 50%, var(--brand-soft), transparent 50%, var(--accent-soft), transparent)',
              filter: 'blur(14px)',
              opacity: 0.7,
            }}
          />
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-xl border bg-[var(--bg-base)] shadow-[var(--shadow-card)]"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <Icon className="h-6 w-6 text-[var(--brand)]" />
          </div>
        </div>

        <div className="flex max-w-md flex-col gap-1.5">
          <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text-display)]">
            {title}
          </h3>
          {description ? (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>

        {steps && steps.length > 0 ? (
          <ol className="mt-2 flex w-full max-w-md flex-col gap-2 text-left">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border bg-[var(--bg-subtle)] px-3 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[10px] font-semibold text-[var(--brand-ink)]">
                  {i + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{s.label}</span>
                  {s.description ? (
                    <span className="text-xs text-[var(--text-muted)]">{s.description}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {action ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
