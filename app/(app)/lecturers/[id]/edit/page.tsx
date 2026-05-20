import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LecturerForm } from '@/components/lecturers/lecturer-form';
import { getLecturer } from '@/lib/actions/lecturers';

export default async function EditLecturerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getLecturer(id);
  if (!result.ok || !result.data) notFound();
  const l = result.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/lecturers/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke detail
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit dosen</CardTitle>
          <CardDescription>Perbarui data {l.full_name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <LecturerForm
            mode="edit"
            lecturerId={id}
            initialValues={{
              full_name: l.full_name,
              title: l.title ?? '',
              university: l.university ?? '',
              faculty: l.faculty ?? '',
              email: l.email ?? '',
              whatsapp: l.whatsapp ?? '',
              characteristics: l.characteristics ?? '',
              tags: l.tags ?? [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
