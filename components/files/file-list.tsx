'use client';

import * as React from 'react';
import { Download, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileCategoryBadge } from './category-badge';
import { deleteFile, getSignedDownloadUrl, type FileRow } from '@/lib/actions/files';
import {
  FILE_CATEGORIES,
  FILE_CATEGORY_LABEL,
  type FileCategory,
} from '@/lib/schemas/file';
import { formatFileSize } from '@/lib/format-file';
import { formatTanggal } from '@/lib/format';

interface FileListProps {
  data: FileRow[];
  onDeleted?: (id: string) => void;
}

const ALL = 'all' as const;

export function FileList({ data, onDeleted }: FileListProps) {
  const [filter, setFilter] = React.useState<FileCategory | typeof ALL>(ALL);
  const [query, setQuery] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const visible = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.filter((f) => {
      if (filter !== ALL && (f.category ?? 'lainnya') !== filter) return false;
      if (!q) return true;
      return f.filename.toLowerCase().includes(q);
    });
  }, [data, filter, query]);

  async function handleDownload(file: FileRow) {
    const result = await getSignedDownloadUrl(file.id);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    window.open(result.data.url, '_blank');
  }

  function handleDelete(file: FileRow) {
    if (confirmId !== file.id) {
      setConfirmId(file.id);
      toast.warning(`Hapus ${file.filename}? Klik sekali lagi untuk konfirmasi.`);
      window.setTimeout(() => setConfirmId(null), 4000);
      return;
    }
    startTransition(async () => {
      const result = await deleteFile(file.id);
      setConfirmId(null);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success('File dihapus.');
      onDeleted?.(file.id);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama file…"
              className="pl-8"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FileCategory | typeof ALL)}
            className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <option value={ALL}>Semua kategori</option>
            {FILE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {FILE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{visible.length} file</span>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Nama file</th>
              <th className="px-4 py-2 font-medium">Kategori</th>
              <th className="px-4 py-2 font-medium">Ukuran</th>
              <th className="px-4 py-2 font-medium">Diunggah</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-[var(--text-muted)]"
                >
                  Belum ada file yang cocok.
                </td>
              </tr>
            ) : (
              visible.map((file) => (
                <tr
                  key={file.id}
                  className="border-t transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-3 align-top">
                    <button
                      onClick={() => handleDownload(file)}
                      className="text-left text-sm font-medium text-[var(--text-primary)] hover:underline"
                    >
                      {file.filename}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <FileCategoryBadge category={file.category} />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-[var(--text-secondary)]">
                    {formatFileSize(file.size_bytes ?? null)}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-[var(--text-secondary)]">
                    {formatTanggal(file.uploaded_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Menu untuk ${file.filename}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={pending}
                          onSelect={() => handleDelete(file)}
                          className={confirmId === file.id ? 'text-[var(--danger)]' : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                          {confirmId === file.id ? 'Klik lagi konfirmasi' : 'Hapus'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
