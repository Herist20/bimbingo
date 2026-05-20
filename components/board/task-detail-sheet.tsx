'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/schemas/task';
import {
  addTaskComment,
  deleteTask,
  listTaskComments,
  updateTask,
  type TaskCommentRow,
  type TaskRow,
} from '@/lib/actions/tasks';
import { formatTanggal } from '@/lib/format';

interface TaskDetailSheetProps {
  task: TaskRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskChanged: (task: TaskRow) => void;
  onTaskDeleted: (id: string) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onTaskChanged,
  onTaskDeleted,
}: TaskDetailSheetProps) {
  const [draft, setDraft] = React.useState<TaskRow>(task);
  const [comments, setComments] = React.useState<TaskCommentRow[]>([]);
  const [commentBody, setCommentBody] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setDraft(task);
    setConfirmDelete(false);
  }, [task]);

  React.useEffect(() => {
    if (!open) return;
    listTaskComments(task.id).then((result) => {
      if (result.ok) setComments(result.data);
    });
  }, [open, task.id]);

  function save() {
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title: draft.title,
        description: draft.description ?? '',
        status: draft.status as TaskStatus,
        priority: draft.priority as TaskPriority,
        due_date: draft.due_date ?? '',
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Task tersimpan.');
      onTaskChanged(result.data);
    });
  }

  function postComment() {
    if (!commentBody.trim()) return;
    startTransition(async () => {
      const result = await addTaskComment({ task_id: task.id, body: commentBody.trim() });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setComments((prev) => [result.data, ...prev]);
      setCommentBody('');
    });
  }

  function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Task dihapus.');
      onTaskDeleted(task.id);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Detail task</SheetTitle>
          <SheetDescription>
            Dibuat {formatTanggal(task.created_at)} · diperbarui {formatTanggal(task.updated_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Judul" htmlFor="td-title" required>
            <Input
              id="td-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" htmlFor="td-status">
              <select
                id="td-status"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioritas" htmlFor="td-priority">
              <select
                id="td-priority"
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deadline" htmlFor="td-due">
              <Input
                id="td-due"
                type="date"
                value={draft.due_date ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Deskripsi" htmlFor="td-desc">
            <textarea
              id="td-desc"
              rows={4}
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)] border-[var(--border-strong)]"
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={remove}
              disabled={pending}
              className={confirmDelete ? 'text-[var(--danger)]' : ''}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Klik lagi untuk konfirmasi' : 'Hapus'}
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Catatan / komentar</h3>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Catatan revisi dari dosbing, dll."
                className="flex-1 rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)] border-[var(--border-strong)]"
              />
              <Button onClick={postComment} disabled={pending || !commentBody.trim()}>
                Kirim
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {comments.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Belum ada catatan.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border p-2 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p className="whitespace-pre-line">{c.body}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {formatTanggal(c.created_at, 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
