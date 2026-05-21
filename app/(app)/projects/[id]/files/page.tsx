import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilesSection } from '@/components/files/files-section';
import { PageHeader } from '@/components/shared/page-header';
import { getProject } from '@/lib/actions/projects';
import { listFilesByProject } from '@/lib/actions/files';

export const dynamic = 'force-dynamic';

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [projectResult, filesResult] = await Promise.all([
    getProject(id),
    listFilesByProject(id),
  ]);

  if (!projectResult.ok || !projectResult.data) notFound();
  const { project } = projectResult.data;
  const files = filesResult.ok ? filesResult.data : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Detail proyek
      </Link>

      <PageHeader
        kicker={`Berkas · ${project.title}`}
        title="Arsip dokumen"
        description="Draf bab, referensi, bukti bayar, administrasi. File disimpan privat di Supabase Storage — download via signed URL (kadaluarsa 1 jam)."
        meta={
          <>
            <span className="chip chip-brand">{files.length} berkas</span>
            <span className="chip">Private bucket</span>
            <span className="chip">Signed URL · 1 jam</span>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Upload & arsip</CardTitle>
          <CardDescription>
            Drag file ke area upload, atau klik pilih dari komputer. Tipe apa saja diterima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilesSection projectId={id} initial={files} />
        </CardContent>
      </Card>
    </div>
  );
}
