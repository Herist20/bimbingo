'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintTrigger() {
  return (
    <Button
      size="sm"
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
    >
      <Printer className="h-4 w-4" />
      Cetak / Simpan PDF
    </Button>
  );
}
