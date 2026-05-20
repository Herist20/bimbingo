import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/clients/client-form';
import { getClient } from '@/lib/actions/clients';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getClient(id);
  if (!result.ok || !result.data) notFound();

  const c = result.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke detail
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit klien</CardTitle>
          <CardDescription>Perbarui data {c.full_name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            mode="edit"
            clientId={id}
            initialValues={{
              full_name: c.full_name,
              nickname: c.nickname ?? '',
              whatsapp: c.whatsapp,
              email: c.email ?? '',
              university: c.university ?? '',
              faculty: c.faculty ?? '',
              major: c.major ?? '',
              student_id: c.student_id ?? '',
              semester: c.semester ?? undefined,
              target_defense: c.target_defense ?? '',
              source: c.source ?? '',
              notes: c.notes ?? '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
