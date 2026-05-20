import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/components/projects/project-form';
import { getClient } from '@/lib/actions/clients';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const params = await searchParams;
  const [maybeClient, cfResult] = await Promise.all([
    params.client_id ? getClient(params.client_id) : Promise.resolve(null),
    listCustomFields('project'),
  ]);
  const initialClient =
    maybeClient && 'ok' in maybeClient && maybeClient.ok ? maybeClient.data : null;
  const customFields = cfResult.ok ? cfResult.data : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar proyek
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Tambah proyek baru</CardTitle>
          <CardDescription>
            Pilih klien, isi judul & nilai kontrak. Setelah proyek dibuat, Anda bisa
            menyesuaikan bab & menetapkan dosen pembimbing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm initialClient={initialClient} customFields={customFields} />
        </CardContent>
      </Card>
    </div>
  );
}
