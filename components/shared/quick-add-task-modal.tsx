'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CheckCircle2, FolderKanban, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
} from '@/lib/schemas/task';
import { createTask } from '@/lib/actions/tasks';
import { listActiveProjectsLite, type ProjectLiteRow } from '@/lib/actions/projects';

export const QUICK_ADD_TASK_EVENT = 'bimbingo:quick-add-task';

interface OpenDetail {
  projectId?: string;
}

export function dispatchQuickAddTask(detail?: OpenDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUICK_ADD_TASK_EVENT, { detail }));
}

export function QuickAddTaskModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<ProjectLiteRow[]>([]);
  const [projectsLoading, setProjectsLoading] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string>('');
  const [search, setSearch] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [status, setStatus] = React.useState<string>('backlog');
  const [priority, setPriority] = React.useState<string>('medium');
  const [dueDate, setDueDate] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<OpenDetail | undefined>;
      setOpen(true);
      if (ce.detail?.projectId) setProjectId(ce.detail.projectId);
    }
    window.addEventListener(QUICK_ADD_TASK_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_ADD_TASK_EVENT, onOpen);
  }, []);

  // Fetch projects saat modal pertama dibuka
  React.useEffect(() => {
    if (!open || projects.length > 0) return;
    setProjectsLoading(true);
    listActiveProjectsLite().then((result) => {
      if (result.ok) setProjects(result.data);
      setProjectsLoading(false);
    });
  }, [open, projects.length]);

  // Reset form saat ditutup
  React.useEffect(() => {
    if (open) return;
    setSearch('');
    setTitle('');
    setStatus('backlog');
    setPriority('medium');
    setDueDate('');
    // projectId tetap supaya re-open dgn same context cepat
  }, [open]);

  const filteredProjects = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const selectedProject = projects.find((p) => p.id === projectId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      toast.error('Pilih proyek dulu.');
      return;
    }
    if (!title.trim()) {
      toast.error('Judul task tidak boleh kosong.');
      return;
    }
    startTransition(async () => {
      const result = await createTask({
        project_id: projectId,
        title: title.trim(),
        status,
        priority,
        due_date: dueDate,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Task ditambahkan.');
      setOpen(false);
      // refresh page kalau sedang di board project terkait
      router.refresh();
    });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-[var(--brand)]" />
              <DialogPrimitive.Title className="font-display text-base font-semibold">
                Tambah task cepat
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              aria-label="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description className="sr-only">
            Tambah task baru ke proyek tertentu tanpa meninggalkan halaman saat ini.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
            {/* Project picker */}
            <Field
              label={
                <span className="flex items-center justify-between">
                  <span>Proyek</span>
                  {selectedProject ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--success)]">
                      <CheckCircle2 className="h-3 w-3" />
                      Terpilih
                    </span>
                  ) : null}
                </span>
              }
              required
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  type="search"
                  placeholder={
                    selectedProject
                      ? `${selectedProject.title} · ${selectedProject.client_name}`
                      : 'Cari proyek aktif…'
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  autoFocus={!projectId}
                />
              </div>
              {projectsLoading ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memuat proyek…
                </p>
              ) : (
                <ul
                  className="mt-1 flex max-h-40 flex-col overflow-y-auto rounded-md border bg-[var(--bg-subtle)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {filteredProjects.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-[var(--text-muted)]">
                      Tidak ada proyek cocok. Coba kata lain atau buat proyek dulu.
                    </li>
                  ) : (
                    filteredProjects.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectId(p.id);
                            setSearch('');
                          }}
                          className={cn(
                            'flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[var(--bg-muted)]',
                            projectId === p.id && 'bg-[var(--brand-soft)]',
                          )}
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{p.title}</span>
                            <span className="truncate text-[10px] text-[var(--text-muted)]">
                              {p.client_name}
                            </span>
                          </span>
                          {projectId === p.id ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-[var(--brand)]" />
                          ) : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </Field>

            {/* Title */}
            <Field label="Judul task" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bab 2 — Tinjauan Pustaka"
                autoFocus={Boolean(projectId)}
              />
            </Field>

            {/* Status + Priority + Date */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prioritas">
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Deadline">
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
            </div>

            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] text-[var(--text-muted)]">
                Tip: tekan <kbd className="kbd">⌘/Ctrl K</kbd> kapan saja untuk buka command palette.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                  Batal
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Menyimpan…' : 'Tambah task'}
                </Button>
              </div>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
