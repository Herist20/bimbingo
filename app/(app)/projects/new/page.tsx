import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/components/projects/project-form';
import { getClient } from '@/lib/actions/clients';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const params = await searchParams;
  let initialClient = null;
  if (params.client_id) {
    const result = await getClient(params.client_id);
    if (result.ok) initialClient = result.data;
  }

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
          <ProjectForm initialClient={initialClient} />
        </CardContent>
      </Card>
    </div>
  );
}
