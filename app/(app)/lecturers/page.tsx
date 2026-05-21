import Link from 'next/link';
import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LecturersTable } from '@/components/lecturers/lecturers-table';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { listLecturers } from '@/lib/actions/lecturers';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function LecturersPage() {
  const [result, cfResult] = await Promise.all([
    listLecturers(),
    listCustomFields('lecturer'),
  ]);
  const customFields = cfResult.ok ? cfResult.data : [];
  const totalCount = result.ok ? result.data.length : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        kicker="Data · Dosen"
        title="Pembimbing & penguji"
        description="Catat karakteristik dosen (suka revisi format, suka topik kuantitatif, dll) untuk profiling. Berguna saat assign ke proyek baru."
        meta={<span className="chip chip-brand">{totalCount} dosen tercatat</span>}
        actions={
          <Button asChild>
            <Link href="/lecturers/new">
              <Plus className="h-4 w-4" />
              Tambah dosen
            </Link>
          </Button>
        }
      />

      <OnboardingHint
        storageKey="lecturers-intro"
        title="Kenapa profiling dosen?"
        description="Field 'Karakteristik' dan 'Tag' membantu mahasiswa baru menyesuaikan style nulis. Mis. 'suka margin 1.5cm', 'kuat di kualitatif', 'biasanya minta tatap muka Selasa'."
      />

      {!result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat dosen</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Belum ada dosen"
          description="Daftarkan dosen yang sering muncul di kampus target. Data ini bisa di-pilih cepat saat assign pembimbing/penguji proyek baru."
          steps={[
            { label: 'Tambah dosen', description: 'Nama, gelar, kampus, fakultas.' },
            { label: 'Catat karakteristik', description: 'Tips praktis dari pengalaman bimbingan.' },
            { label: 'Tag untuk filter', description: 'Mis. tag “kualitatif”, “revisi keras”.' },
          ]}
          action={
            <Button asChild>
              <Link href="/lecturers/new">
                <Plus className="h-4 w-4" />
                Tambah dosen pertama
              </Link>
            </Button>
          }
        />
      ) : (
        <LecturersTable data={result.data} customFields={customFields} />
      )}
    </div>
  );
}
