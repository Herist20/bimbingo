import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LecturerForm } from '@/components/lecturers/lecturer-form';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function NewLecturerPage() {
  const cfResult = await listCustomFields('lecturer');
  const customFields = cfResult.ok ? cfResult.data : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/lecturers"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar dosen
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Tambah dosen baru</CardTitle>
          <CardDescription>
            Isi data dosen + catatan karakteristik untuk memandu pengerjaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LecturerForm mode="create" customFields={customFields} />
        </CardContent>
      </Card>
    </div>
  );
}
