'use client';

import * as React from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_PREFIX = 'bimbingo:hint:';

interface OnboardingHintProps {
  /** Kunci unik untuk persist dismiss state di localStorage. */
  storageKey: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  /** Variant warna. Default brand. */
  tone?: 'brand' | 'info' | 'success';
}

const TONE_BG: Record<NonNullable<OnboardingHintProps['tone']>, string> = {
  brand: 'var(--brand-soft)',
  info: 'var(--info-soft)',
  success: 'var(--success-soft)',
};

const TONE_INK: Record<NonNullable<OnboardingHintProps['tone']>, string> = {
  brand: 'var(--brand-ink)',
  info: 'var(--info)',
  success: 'var(--success)',
};

export function OnboardingHint({
  storageKey,
  title,
  description,
  action,
  className,
  tone = 'brand',
}: OnboardingHintProps) {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
      setDismissed(raw === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, '1');
    } catch {
      // ignore
    }
  }

  if (dismissed !== false) return null;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 overflow-hidden rounded-lg border p-3 pr-9 text-sm',
        className,
      )}
      style={{
        borderColor: 'var(--border)',
        backgroundColor: TONE_BG[tone],
        color: TONE_INK[tone],
      }}
      role="status"
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-elevated)]"
        style={{ color: TONE_INK[tone] }}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-col">
          <span className="font-medium leading-tight">{title}</span>
          <span className="text-xs leading-relaxed opacity-80">{description}</span>
        </div>
        {action ? <div className="flex flex-wrap gap-2 pt-0.5">{action}</div> : null}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup tip"
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
