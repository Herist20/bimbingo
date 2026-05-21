import Link from 'next/link';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectsTable } from '@/components/projects/projects-table';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { ExportButton } from '@/components/shared/export-button';
import { listProjects } from '@/lib/actions/projects';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [result, cfResult] = await Promise.all([
    listProjects({ includeArchived: true }),
    listCustomFields('project'),
  ]);
  const customFields = cfResult.ok ? cfResult.data : [];
  const totalCount = result.ok ? result.data.length : 0;
  const activeCount = result.ok
    ? result.data.filter((p) => p.status === 'active' && !p.archived_at).length
    : 0;
  const archivedCount = result.ok ? result.data.filter((p) => p.archived_at).length : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        kicker="Data · Proyek"
        title="Proyek skripsi"
        description="Setiap proyek memuat milestone bab, board task, file, dan pembayaran. Buat baru dari sini atau lompat ke board lewat menu kebab di baris."
        meta={
          <>
            <span className="chip chip-brand">{activeCount} aktif</span>
            {archivedCount > 0 ? <span className="chip">{archivedCount} arsip</span> : null}
            <span className="chip">{totalCount} total</span>
          </>
        }
        actions={
          <>
            <ExportButton entity="projects" />
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Tambah proyek
              </Link>
            </Button>
          </>
        }
      />

      <OnboardingHint
        storageKey="projects-intro"
        title="Alur kerja proyek"
        description="Setelah membuat proyek: isi milestone bab (Bab 1-5 + Sidang) → buka tab Board untuk drag task → tab Keuangan untuk catat termin pembayaran."
      />

      {!result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat proyek</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Belum ada proyek"
          description="Buat proyek pertama: pilih klien, isi judul + nilai kontrak. Sistem auto-generate 6 milestone default (Bab 1-5 + Sidang)."
          steps={[
            { label: 'Pastikan klien sudah terdaftar', description: 'Buka /clients jika belum.' },
            { label: 'Klik Tambah proyek', description: 'Pilih klien, isi judul, nilai kontrak.' },
            { label: 'Kerjakan via Board', description: 'Drag task antar kolom kanban.' },
          ]}
          action={
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Tambah proyek pertama
              </Link>
            </Button>
          }
        />
      ) : (
        <ProjectsTable data={result.data} customFields={customFields} />
      )}
    </div>
  );
}
