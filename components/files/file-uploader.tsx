'use client';

import * as React from 'react';
import { CheckCircle2, CloudUpload, FileWarning, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { getSignedUploadUrl, recordFileMetadata, type FileRow } from '@/lib/actions/files';
import { getBrowserSupabase } from '@/lib/supabase/client';
import {
  ALLOWED_MIME_TYPES,
  FILE_CATEGORIES,
  FILE_CATEGORY_LABEL,
  MAX_FILE_BYTES,
  type FileCategory,
} from '@/lib/schemas/file';
import { formatFileSize } from '@/lib/format-file';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  projectId: string;
  taskId?: string;
  onUploaded?: (file: FileRow) => void;
}

type UploadState = {
  id: string;
  file: File;
  progress: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
};

export function FileUploader({ projectId, taskId, onUploaded }: FileUploaderProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [items, setItems] = React.useState<UploadState[]>([]);
  const [category, setCategory] = React.useState<FileCategory>('draft');
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const itemId = crypto.randomUUID();
    setItems((prev) => [...prev, { id: itemId, file, progress: 'pending' }]);

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, progress: 'error', message: 'Tipe file tidak didukung.' } : p,
        ),
      );
      toast.error(`${file.name}: tipe tidak didukung.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, progress: 'error', message: 'Lebih dari 25 MB.' } : p,
        ),
      );
      toast.error(`${file.name}: > 25 MB.`);
      return;
    }

    setItems((prev) => prev.map((p) => (p.id === itemId ? { ...p, progress: 'uploading' } : p)));

    const signed = await getSignedUploadUrl({
      project_id: projectId,
      task_id: taskId,
      filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      category,
    });
    if (!signed.ok) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, progress: 'error', message: signed.error.message } : p,
        ),
      );
      toast.error(`${file.name}: ${signed.error.message}`);
      return;
    }

    const supabase = getBrowserSupabase();
    const { error: uploadError } = await supabase.storage
      .from(signed.data.bucket)
      .uploadToSignedUrl(signed.data.path, signed.data.token, file, {
        contentType: file.type,
      });

    if (uploadError) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, progress: 'error', message: uploadError.message } : p,
        ),
      );
      toast.error(`${file.name}: gagal upload.`);
      return;
    }

    const recorded = await recordFileMetadata({
      project_id: projectId,
      task_id: taskId,
      path: signed.data.path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      category,
    });
    if (!recorded.ok) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, progress: 'error', message: recorded.error.message } : p,
        ),
      );
      toast.error(`${file.name}: gagal simpan metadata.`);
      return;
    }

    setItems((prev) =>
      prev.map((p) => (p.id === itemId ? { ...p, progress: 'success' } : p)),
    );
    toast.success(`${file.name} ter-upload.`);
    onUploaded?.(recorded.data);
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    // sequential supaya UI progress jelas; switch ke Promise.all kalau perlu
    for (const f of arr) {
      await uploadFile(f);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Kategori untuk batch berikutnya" htmlFor="upload-category">
        <select
          id="upload-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as FileCategory)}
          className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm sm:w-60"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          {FILE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {FILE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </Field>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) {
            void handleFiles(e.dataTransfer.files);
          }
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          dragOver
            ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
            : 'border-[var(--border-strong)] bg-[var(--bg-subtle)]',
        )}
      >
        <CloudUpload className="h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm">
          Tarik file ke sini atau{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-[var(--brand)] hover:underline"
          >
            pilih dari komputer
          </button>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          PDF · DOCX · gambar · ZIP · max 25 MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              void handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex min-w-0 items-center gap-2">
                {item.progress === 'uploading' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--brand)]" />
                ) : item.progress === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
                ) : item.progress === 'error' ? (
                  <FileWarning className="h-4 w-4 shrink-0 text-[var(--danger)]" />
                ) : null}
                <span className="truncate">{item.file.name}</span>
                <span className="shrink-0 text-[var(--text-muted)]">
                  {formatFileSize(item.file.size)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.message ? (
                  <span className="text-[var(--danger)]">{item.message}</span>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Bersihkan dari daftar"
                  onClick={() => setItems((prev) => prev.filter((p) => p.id !== item.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
