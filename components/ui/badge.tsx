import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      tone: {
        neutral:
          'bg-[var(--bg-muted)] text-[var(--text-secondary)] ring-[var(--border)]',
        brand:
          'bg-[var(--brand-soft)] text-[var(--brand)] ring-[color-mix(in_oklab,var(--brand)_30%,transparent)]',
        success:
          'bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-[var(--success)] ring-[color-mix(in_oklab,var(--success)_30%,transparent)]',
        warning:
          'bg-[color-mix(in_oklab,var(--warning)_18%,transparent)] text-[var(--warning)] ring-[color-mix(in_oklab,var(--warning)_30%,transparent)]',
        danger:
          'bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] text-[var(--danger)] ring-[color-mix(in_oklab,var(--danger)_30%,transparent)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
