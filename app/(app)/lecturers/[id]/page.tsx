import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getLecturer } from '@/lib/actions/lecturers';
import { formatTanggal } from '@/lib/format';

export default async function LecturerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getLecturer(id);
  if (!result.ok || !result.data) notFound();
  const l = result.data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/lecturers"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Daftar dosen
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {l.title ? `${l.title} ${l.full_name}` : l.full_name}
          </h1>
          {l.university ? (
            <p className="text-sm text-[var(--text-secondary)]">{l.university}</p>
          ) : null}
        </div>
        <Button asChild variant="secondary">
          <Link href={`/lecturers/${l.id}/edit`}>
            <PencilLine className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontak</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <DataRow label="Email" value={l.email} />
          <DataRow label="WhatsApp" value={l.whatsapp} mono />
          <DataRow label="Fakultas" value={l.faculty} />
        </CardContent>
      </Card>

      {(l.tags?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tag</CardTitle>
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

      {l.characteristics ? (
        <Card>
          <CardHeader>
            <CardTitle>Karakteristik</CardTitle>
            <CardDescription>Gaya revisi, jam respon, hal yang harus dihindari.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-[var(--text-secondary)]">
              {l.characteristics}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
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
      <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <span className={mono ? 'font-mono text-sm' : 'text-sm'}>{value ?? '—'}</span>
    </div>
  );
}
