import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientsTable } from '@/components/clients/clients-table';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { ExportButton } from '@/components/shared/export-button';
import { listClients } from '@/lib/actions/clients';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const [result, cfResult] = await Promise.all([
    listClients({ includeArchived: true }),
    listCustomFields('client'),
  ]);
  const customFields = cfResult.ok ? cfResult.data : [];
  const activeCount = result.ok ? result.data.filter((c) => !c.archived_at).length : 0;
  const archivedCount = result.ok ? result.data.filter((c) => c.archived_at).length : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        kicker="Data · Klien"
        title="Mahasiswa dampingan"
        description="Catat detail kontak, kampus, target sidang. Klik 'Kelola kolom' untuk menambah field kustom seperti angkatan, IG, atau prefer komunikasi."
        meta={
          <>
            <span className="chip chip-brand">{activeCount} aktif</span>
            {archivedCount > 0 ? <span className="chip">{archivedCount} arsip</span> : null}
          </>
        }
        actions={
          <>
            <ExportButton entity="clients" />
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                Tambah klien
              </Link>
            </Button>
          </>
        }
      />

      <OnboardingHint
        storageKey="clients-intro"
        title="Tip — kolom kustom"
        description="Klik tombol Kelola kolom di kanan atas tabel untuk tambah field sendiri (mis. 'Angkatan', 'IG handle'). Field langsung muncul di form & tabel."
      />

      {!result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat klien</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada klien"
          description="Mulai dengan mendaftarkan mahasiswa pertama. Data ini jadi pondasi untuk proyek, milestone, dan pembayaran."
          steps={[
            { label: 'Tambah klien', description: 'Nama, WhatsApp, kampus, target sidang.' },
            { label: 'Buat proyek skripsi', description: 'Pilih klien & set nilai kontrak.' },
            { label: 'Atur milestone & task', description: 'Bab 1-5 auto-generate, drag di board.' },
          ]}
          action={
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                Tambah klien pertama
              </Link>
            </Button>
          }
        />
      ) : (
        <ClientsTable data={result.data} customFields={customFields} />
      )}
    </div>
  );
}
