'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[portal error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Halaman tidak bisa dimuat</CardTitle>
          <CardDescription>
            Terjadi kendala saat mengambil data. Coba muat ulang. Jika masalah berlanjut,
            hubungi pembimbing Anda.
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
