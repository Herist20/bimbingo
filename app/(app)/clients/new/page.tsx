import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/clients/client-form';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function NewClientPage() {
  const cfResult = await listCustomFields('client');
  const customFields = cfResult.ok ? cfResult.data : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar klien
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Tambah klien baru</CardTitle>
          <CardDescription>
            Isi data mahasiswa. Field bertanda <span className="text-[var(--danger)]">*</span>{' '}
            wajib diisi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm mode="create" customFields={customFields} />
        </CardContent>
      </Card>
    </div>
  );
}
