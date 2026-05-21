import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/page-header';
import { getLecturer } from '@/lib/actions/lecturers';
import { listCustomFields } from '@/lib/actions/custom-fields';
import { CustomDataSection } from '@/components/custom-fields/custom-data-section';
import { formatTanggal } from '@/lib/format';

export default async function LecturerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, cfResult] = await Promise.all([
    getLecturer(id),
    listCustomFields('lecturer'),
  ]);
  if (!result.ok || !result.data) notFound();
  const l = result.data;
  const customFields = cfResult.ok ? cfResult.data.filter((f) => !f.archived_at) : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/lecturers"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Daftar dosen
      </Link>

      <PageHeader
        kicker="Dosen pembimbing / penguji"
        title={l.title ? `${l.title} ${l.full_name}` : l.full_name}
        description={l.university ?? undefined}
        meta={
          (l.tags?.length ?? 0) > 0 ? (
            <>
              {l.tags.slice(0, 6).map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
              {l.tags.length > 6 ? (
                <span className="chip">+{l.tags.length - 6}</span>
              ) : null}
            </>
          ) : null
        }
        actions={
          <Button asChild variant="secondary">
            <Link href={`/lecturers/${l.id}/edit`}>
              <PencilLine className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Kontak</CardTitle>
            <CardDescription>Channel komunikasi dengan dosen.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <DataRow label="Email" value={l.email} />
            <DataRow label="WhatsApp" value={l.whatsapp} mono />
            <DataRow label="Fakultas" value={l.faculty} />
          </CardContent>
        </Card>

        {(l.tags?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Tag profiling</CardTitle>
              <CardDescription>Filter cepat berdasar karakter dosen.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {l.tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {l.characteristics ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Karakteristik</CardTitle>
            <CardDescription>
              Gaya revisi, jam respon, hal yang harus dihindari saat bimbingan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
              {l.characteristics}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <CustomDataSection fields={customFields} data={l.custom_data ?? {}} />

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)]">
        <span>Dibuat: {formatTanggal(l.created_at)}</span>
        <span className="text-right">Diperbarui: {formatTanggal(l.updated_at)}</span>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className={mono ? 'font-mono text-sm text-[var(--text-primary)]' : 'text-sm text-[var(--text-primary)]'}>
        {value ?? <span className="text-[var(--text-muted)]">—</span>}
      </span>
    </div>
  );
}
