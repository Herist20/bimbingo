import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientsTable } from '@/components/clients/clients-table';
import { listClients } from '@/lib/actions/clients';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const [result, cfResult] = await Promise.all([
    listClients({ includeArchived: true }),
    listCustomFields('client'),
  ]);
  const customFields = cfResult.ok ? cfResult.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Klien</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Kelola data mahasiswa yang sedang didampingi.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            Tambah klien
          </Link>
        </Button>
      </div>

      {!result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat klien</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada klien</CardTitle>
            <CardDescription>Mulai dengan menambah klien pertama Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                Tambah klien pertama
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ClientsTable data={result.data} customFields={customFields} />
      )}
    </div>
  );
}
