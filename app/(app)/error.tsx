'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Terjadi kesalahan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Halaman gagal dimuat</CardTitle>
          <CardDescription>
            {error.message || 'Terjadi kesalahan tak terduga. Coba muat ulang.'}
            {error.digest ? (
              <>
                {' '}
                <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs">
                  {error.digest}
                </code>
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" />
            Coba lagi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
