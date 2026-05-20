import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getClient } from '@/lib/actions/clients';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getClient(id);
  if (!result.ok || !result.data) notFound();

  const c = result.data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Daftar klien
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{c.full_name}</h1>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            {c.nickname ? <span>{c.nickname}</span> : null}
            {c.archived_at ? <Badge tone="neutral">Arsip</Badge> : <Badge tone="brand">Aktif</Badge>}
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/clients/${c.id}/edit`}>
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
          <Field label="WhatsApp" value={c.whatsapp} mono />
          <Field label="Email" value={c.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Akademis</CardTitle>
          <CardDescription>Data kampus & jadwal sidang.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Kampus" value={c.university} />
          <Field label="Fakultas" value={c.faculty} />
          <Field label="Jurusan" value={c.major} />
          <Field label="NIM" value={c.student_id} mono />
          <Field label="Semester" value={c.semester ? String(c.semester) : null} />
          <Field
            label="Target sidang"
            value={c.target_defense ? `${formatTanggal(c.target_defense)} (${formatTanggalRelatif(c.target_defense)})` : null}
          />
        </CardContent>
      </Card>

      {c.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-[var(--text-secondary)]">{c.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
        <span>Dibuat: {formatTanggal(c.created_at)}</span>
        <span className="text-right">Diperbarui: {formatTanggal(c.updated_at)}</span>
      </div>
    </div>
  );
}

function Field({
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
