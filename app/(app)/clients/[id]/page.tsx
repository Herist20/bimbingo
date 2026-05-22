import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/page-header';
import { WhatsAppButton } from '@/components/shared/whatsapp-button';
import { ClientProjectsSection } from '@/components/clients/client-projects-section';
import { getClient } from '@/lib/actions/clients';
import { listCustomFields } from '@/lib/actions/custom-fields';
import { CustomDataSection } from '@/components/custom-fields/custom-data-section';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { InvitePortalButton } from '@/components/clients/invite-portal-button';
import { RevokePortalButton } from '@/components/clients/revoke-portal-button';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, cfResult] = await Promise.all([
    getClient(id),
    listCustomFields('client'),
  ]);
  if (!result.ok || !result.data) notFound();

  const c = result.data;
  const customFields = cfResult.ok ? cfResult.data.filter((f) => !f.archived_at) : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/clients"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Daftar klien
      </Link>

      <PageHeader
        kicker={c.archived_at ? 'Klien · arsip' : 'Klien · aktif'}
        title={c.full_name}
        description={c.nickname ? `Akrab dipanggil ${c.nickname}.` : undefined}
        meta={
          <>
            {c.university ? <span className="chip">{c.university}</span> : null}
            {c.major ? <span className="chip">{c.major}</span> : null}
            {c.target_defense ? (
              <span className="chip chip-brand">
                Sidang {formatTanggalRelatif(c.target_defense)}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <WhatsAppButton
              phone={c.whatsapp}
              context={{ clientName: c.nickname || c.full_name }}
            />
            <Button asChild variant="secondary">
              <Link href={`/clients/${c.id}/edit`}>
                <PencilLine className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Kontak</CardTitle>
            <CardDescription>Komunikasi utama klien.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <DetailRow label="WhatsApp" value={c.whatsapp} mono copyable />
            <DetailRow label="Email" value={c.email} />
            <DetailRow label="Sumber" value={c.source} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Akademis</CardTitle>
            <CardDescription>Kampus, jurusan, target sidang.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailRow label="Kampus" value={c.university} />
            <DetailRow label="Fakultas" value={c.faculty} />
            <DetailRow label="Jurusan" value={c.major} />
            <DetailRow label="NIM" value={c.student_id} mono />
            <DetailRow label="Semester" value={c.semester ? String(c.semester) : null} />
            <DetailRow
              label="Target sidang"
              value={
                c.target_defense
                  ? `${formatTanggal(c.target_defense)} (${formatTanggalRelatif(c.target_defense)})`
                  : null
              }
            />
          </CardContent>
        </Card>
      </div>

      {c.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Catatan</CardTitle>
            <CardDescription>Konteks tambahan dari pertemuan / observasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
              {c.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <CustomDataSection fields={customFields} data={c.custom_data ?? {}} />

      <Card>
        <CardHeader>
          <CardTitle>Akses Portal</CardTitle>
          <CardDescription>
            Klien dapat login di /portal/login dan melihat progres proyek sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!c.email ? (
            <p className="text-sm text-[var(--text-muted)]">
              Tambahkan email klien dulu sebelum mengaktifkan portal.
            </p>
          ) : c.client_user_id ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="success">Aktif</Badge>
                <span className="text-sm text-[var(--text-muted)]">
                  Klien login dengan {c.email}.
                </span>
              </div>
              <RevokePortalButton clientId={c.id} />
            </div>
          ) : (
            <InvitePortalButton clientId={c.id} />
          )}
        </CardContent>
      </Card>

      <ClientProjectsSection clientId={c.id} clientName={c.nickname || c.full_name} />

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)]">
        <span>Dibuat: {formatTanggal(c.created_at)}</span>
        <span className="text-right">Diperbarui: {formatTanggal(c.updated_at)}</span>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  copyable: _copyable,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  copyable?: boolean;
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
