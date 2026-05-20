import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LecturersTable } from '@/components/lecturers/lecturers-table';
import { AddFieldButton } from '@/components/custom-fields/add-field-button';
import { listLecturers } from '@/lib/actions/lecturers';

export const dynamic = 'force-dynamic';

export default async function LecturersPage() {
  const result = await listLecturers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dosen</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Daftar dosen pembimbing & penguji. Catat karakteristik untuk profiling.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddFieldButton entityType="lecturer" />
          <Button asChild>
            <Link href="/lecturers/new">
              <Plus className="h-4 w-4" />
              Tambah dosen
            </Link>
          </Button>
        </div>
      </div>

      {!result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat dosen</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada dosen</CardTitle>
            <CardDescription>
              Mulai dengan menambah dosen pertama. Data ini akan dipakai saat membuat proyek.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/lecturers/new">
                <Plus className="h-4 w-4" />
                Tambah dosen pertama
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LecturersTable data={result.data} />
      )}
    </div>
  );
}
