'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';

import { CommentThread } from './comment-thread';
import { FileListRow } from './file-list-row';
import {
  listMilestoneFiles,
  type PortalFileRow,
} from '@/lib/actions/portal-files';

export function MilestoneDetailDrawer({
  milestoneId,
  currentUserId,
}: {
  milestoneId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PortalFileRow[] | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    if (!open || files !== null) return;
    start(async () => {
      const res = await listMilestoneFiles(milestoneId);
      if (res.ok) setFiles(res.data);
      else setFiles([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
        {open ? 'Tutup detail' : 'Lihat diskusi & draf'}
      </button>

      {open ? (
        <div
          className="mt-3 space-y-4 rounded-lg border bg-[var(--bg-elevated)] p-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Draf bab
            </p>
            {files === null ? (
              <p className="text-xs text-[var(--text-muted)]">Memuat file…</p>
            ) : files.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                Belum ada draf bab untuk milestone ini.
              </p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListRow
                    key={f.id}
                    id={f.id}
                    filename={f.filename}
                    sizeBytes={f.size_bytes}
                    uploadedAt={f.uploaded_at}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Diskusi
            </p>
            <CommentThread
              milestoneId={milestoneId}
              currentUserId={currentUserId}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
