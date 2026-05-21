'use client';

import * as React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  entity: 'clients' | 'projects' | 'payments';
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function ExportButton({
  entity,
  label = 'Ekspor CSV',
  variant = 'secondary',
  size = 'md',
}: ExportButtonProps) {
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const url = `/api/export/${entity}`;
      // Anchor download — biar Content-Disposition header dipakai browser.
      const a = document.createElement('a');
      a.href = url;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      // Beri sedikit delay supaya status indicator tampak.
      setTimeout(() => setPending(false), 600);
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleClick} disabled={pending}>
      {pending ? (
        <FileSpreadsheet className="h-4 w-4 animate-pulse" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {pending ? 'Mengunduh…' : label}
    </Button>
  );
}
