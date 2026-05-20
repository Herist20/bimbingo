import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectsTable } from '@/components/projects/projects-table';
import { listProjects } from '@/lib/actions/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const result = await listProjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyek</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Daftar proyek skripsi yang sedang & sudah dikerjakan.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            Tambah proyek
          </Link>
        </Button>
      </div>

      {!result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat proyek</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada proyek</CardTitle>
            <CardDescription>
              Buat proyek pertama. Pilih klien, isi judul & nilai kontrak, sistem akan
              generate 6 bab default jika diinginkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Tambah proyek pertama
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProjectsTable data={result.data} />
      )}
    </div>
  );
}
