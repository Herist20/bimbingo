'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Sistem mengalami kendala saat memuat halaman ini.
          {error.digest ? (
            <>
              {' '}
              Kode referensi:{' '}
              <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs">
                {error.digest}
              </code>
            </>
          ) : null}
        </p>
        <Button onClick={() => reset()}>
          <RotateCcw className="h-4 w-4" />
          Coba lagi
        </Button>
      </div>
    </main>
  );
}
