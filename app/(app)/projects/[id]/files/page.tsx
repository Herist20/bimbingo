import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilesSection } from '@/components/files/files-section';
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
    <div className="flex flex-col gap-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Detail proyek
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Arsip dokumen: draf bab, referensi, bukti bayar, dan administrasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload & arsip</CardTitle>
          <CardDescription>
            File disimpan privat di Supabase Storage. URL download di-sign 1 jam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilesSection projectId={id} initial={files} />
        </CardContent>
      </Card>
    </div>
  );
}
