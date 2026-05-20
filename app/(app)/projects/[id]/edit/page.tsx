import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { getProject, updateProject, archiveProject, restoreProject, changeProjectStatus } from '@/lib/actions/projects';
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL, PROJECT_TYPES, PROJECT_TYPE_LABEL } from '@/lib/schemas/project';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProject(id);
  if (!result.ok || !result.data) notFound();
  const { project } = result.data;

  async function save(formData: FormData) {
    'use server';
    const patch = {
      title: String(formData.get('title') ?? ''),
      type: String(formData.get('type') ?? 'skripsi'),
      description: String(formData.get('description') ?? ''),
      total_value: String(formData.get('total_value') ?? '0'),
      start_date: String(formData.get('start_date') ?? ''),
      target_end_date: String(formData.get('target_end_date') ?? ''),
    };
    const result = await updateProject(id, patch);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    const status = String(formData.get('status') ?? '');
    if (status && status !== project.status) {
      await changeProjectStatus(id, status);
    }
    redirect(`/projects/${id}`);
  }

  async function toggleArchive() {
    'use server';
    if (project.archived_at) await restoreProject(id);
    else await archiveProject(id);
    redirect(`/projects/${id}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke detail
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit proyek</CardTitle>
          <CardDescription>Perbarui data dasar proyek.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={save} className="flex flex-col gap-4">
            <Field label="Judul" htmlFor="title" required>
              <Input id="title" name="title" defaultValue={project.title} required />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipe" htmlFor="type">
                <select
                  id="type"
                  name="type"
                  defaultValue={project.type}
                  className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PROJECT_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={project.status}
                  className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Total nilai (Rp)" htmlFor="total_value">
                <Input
                  id="total_value"
                  name="total_value"
                  type="number"
                  min={0}
                  defaultValue={project.total_value}
                />
              </Field>
              <div />
              <Field label="Mulai" htmlFor="start_date">
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={project.start_date ?? ''}
                />
              </Field>
              <Field label="Target selesai" htmlFor="target_end_date">
                <Input
                  id="target_end_date"
                  name="target_end_date"
                  type="date"
                  defaultValue={project.target_end_date ?? ''}
                />
              </Field>
            </div>

            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={project.description ?? ''}
                className="flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)] border-[var(--border-strong)]"
              />
            </Field>

            <div
              className="flex flex-wrap justify-between gap-2 border-t pt-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <Button type="submit" formAction={toggleArchive} variant="secondary">
                {project.archived_at ? 'Pulihkan' : 'Arsipkan'}
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
