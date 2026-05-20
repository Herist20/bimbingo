import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { MilestoneEditor } from '@/components/projects/milestone-editor';
import { LecturerAssignments } from '@/components/projects/lecturer-assignments';
import { getProject } from '@/lib/actions/projects';
import { PROJECT_TYPE_LABEL } from '@/lib/schemas/project';
import { formatRupiah, formatTanggal, formatTanggalRelatif } from '@/lib/format';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProject(id);
  if (!result.ok || !result.data) notFound();
  const { project, milestones, lecturers, finance, progress_percent } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Daftar proyek
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <ProjectStatusBadge status={project.status} />
            <span>{(PROJECT_TYPE_LABEL as Record<string, string>)[project.type] ?? project.type}</span>
            {project.client ? (
              <>
                <span>·</span>
                <Link href={`/clients/${project.client.id}`} className="hover:underline">
                  {project.client.full_name}
                </Link>
              </>
            ) : null}
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/projects/${project.id}/edit`}>
            <PencilLine className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Nilai kontrak" value={formatRupiah(project.total_value)} />
        <Stat label="Sudah dibayar" value={formatRupiah(finance.total_paid)} />
        <Stat
          label="Sisa piutang"
          value={formatRupiah(finance.outstanding)}
          tone={finance.outstanding > 0 ? 'warning' : 'success'}
        />
        <Stat label="Progres" value={`${progress_percent}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bab & milestone</CardTitle>
          <CardDescription>
            Urutan, deadline, weight per bab. Total weight idealnya 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MilestoneEditor projectId={project.id} initial={milestones} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dosen</CardTitle>
          <CardDescription>
            Atur pembimbing & penguji. Klik combobox untuk memilih dosen yang sudah terdaftar
            atau tambah baru inline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LecturerAssignments projectId={project.id} initial={lecturers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Mulai" value={project.start_date ? formatTanggal(project.start_date) : '—'} />
          <Detail
            label="Target selesai"
            value={
              project.target_end_date
                ? `${formatTanggal(project.target_end_date)} (${formatTanggalRelatif(project.target_end_date)})`
                : '—'
            }
          />
          <Detail label="Selesai aktual" value={project.actual_end_date ? formatTanggal(project.actual_end_date) : '—'} />
          {project.description ? (
            <div className="sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Deskripsi
              </span>
              <p className="mt-1 whitespace-pre-line text-sm text-[var(--text-secondary)]">
                {project.description}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
        <span>Dibuat: {formatTanggal(project.created_at)}</span>
        <span className="text-right">Diperbarui: {formatTanggal(project.updated_at)}</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'warning' | 'success';
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className="text-2xl"
          style={{
            color:
              tone === 'warning'
                ? 'var(--warning)'
                : tone === 'success'
                  ? 'var(--success)'
                  : undefined,
          }}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
