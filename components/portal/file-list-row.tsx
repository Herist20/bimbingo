'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getSignedFileUrl } from '@/lib/actions/portal-files';
import { formatTanggal } from '@/lib/format';

export function FileListRow({
  id,
  filename,
  sizeBytes,
  uploadedAt,
}: {
  id: string;
  filename: string;
  sizeBytes: number | null;
  uploadedAt: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    const res = await getSignedFileUrl(id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    window.open(res.data.url, '_blank');
  }

  const sizeKb = sizeBytes ? Math.round(sizeBytes / 1024) : null;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md border bg-[var(--bg-elevated)] p-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {filename}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {sizeKb ? `${sizeKb} KB · ` : ''}diunggah {formatTanggal(uploadedAt)}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleDownload}
        disabled={busy}
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? 'Memproses…' : 'Unduh'}
      </Button>
    </div>
  );
}
