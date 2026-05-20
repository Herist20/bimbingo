'use client';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[var(--bg-base)] group-[.toaster]:text-[var(--text-primary)] group-[.toaster]:border-[var(--border-strong)] group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-[var(--text-secondary)]',
        },
      }}
    />
  );
}
