import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-0.5 text-[var(--danger)]">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
