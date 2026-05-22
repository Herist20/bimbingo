import { CheckCircle2, CreditCard, Info, Receipt } from 'lucide-react';

import { PaymentStatusBadge } from '@/components/portal/payment-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const METHOD_LABEL: Record<string, string> = {
  'transfer-bank': 'Transfer bank',
  qris: 'QRIS',
  'e-wallet': 'E-wallet',
  tunai: 'Tunai',
  lainnya: 'Lainnya',
};

export default async function PortalPembayaranPage() {
  const supabase = await getServerSupabase();

  const [{ data: payments }, { data: finance }] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount, paid_at, method, installment_label, verified, project_id')
      .order('paid_at', { ascending: false }),
    supabase
      .from('project_finance_summary')
      .select('total_paid, total_value, outstanding'),
  ]);

  const totalPaid = (finance ?? []).reduce(
    (sum, r) => sum + Number(r.total_paid ?? 0),
    0,
  );
  const totalValue = (finance ?? []).reduce(
    (sum, r) => sum + Number(r.total_value ?? 0),
    0,
  );
  const outstanding = Math.max(0, totalValue - totalPaid);
  const verifiedCount = (payments ?? []).filter((p) => p.verified).length;
  const pendingCount = (payments ?? []).filter((p) => !p.verified).length;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Keuangan · Termin"
        title="Riwayat pembayaran"
        description="Daftar pembayaran yang sudah dicatat pembimbing. Bila ada termin yang sudah Anda transfer tapi belum muncul, mohon konfirmasi via WhatsApp dengan menyertakan bukti."
        meta={
          <>
            <span className="chip">
              <Receipt className="h-3 w-3" />
              {(payments ?? []).length} pembayaran
            </span>
            {verifiedCount > 0 ? (
              <span className="chip chip-brand">
                <CheckCircle2 className="h-3 w-3" />
                {verifiedCount} terverifikasi
              </span>
            ) : null}
            {pendingCount > 0 ? (
              <span
                className="chip"
                style={{
                  color: 'var(--warning)',
                  borderColor: 'color-mix(in oklab, var(--warning) 30%, transparent)',
                }}
              >
                {pendingCount} menunggu
              </span>
            ) : null}
          </>
        }
      />

      <section aria-label="Ringkasan" className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={<Receipt className="h-4 w-4" />}
          label="Total tagihan"
          value={formatRupiah(totalValue)}
          hint="seluruh proyek aktif"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Sudah dibayar"
          value={formatRupiah(totalPaid)}
          hint={`${verifiedCount} pembayaran tercatat`}
          tone="success"
        />
        <KpiCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Sisa"
          value={formatRupiah(outstanding)}
          hint={
            outstanding > 0
              ? 'menunggu transfer berikutnya'
              : 'lunas — terima kasih!'
          }
          tone={outstanding > 0 ? 'warning' : 'success'}
        />
      </section>

      <section aria-label="Daftar pembayaran" className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-display)]">
            Daftar transaksi
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Diurutkan dari yang terbaru.
          </p>
        </div>

        {(payments ?? []).length === 0 ? (
          <EmptyState
            title="Belum ada pembayaran tercatat"
            description="Pembayaran termin Anda akan muncul di sini setelah pembimbing memverifikasi bukti transfer."
            steps={[
              {
                label: 'Transfer ke rekening pembimbing',
                description: 'Sesuai kesepakatan termin di awal.',
              },
              {
                label: 'Kirim bukti via WhatsApp',
                description: 'Cantumkan judul proyek + termin yang dibayar.',
              },
              {
                label: 'Pembimbing verifikasi',
                description: 'Setelah dicatat, status akan muncul "Terverifikasi" di sini.',
              },
            ]}
          />
        ) : (
          <div
            className="overflow-hidden rounded-lg border bg-[var(--bg-subtle)]"
            style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="text-left"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                >
                  <tr>
                    <Th>Tanggal</Th>
                    <Th>Termin</Th>
                    <Th>Metode</Th>
                    <Th className="text-right">Jumlah</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {(payments ?? []).map((p, idx) => (
                    <tr
                      key={p.id}
                      className="border-t transition-colors hover:bg-[var(--brand-soft)]/30"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        backgroundColor:
                          idx % 2 === 0
                            ? 'var(--bg-elevated)'
                            : 'var(--bg-subtle)',
                      }}
                    >
                      <Td>
                        <span className="font-mono text-xs text-[var(--text-secondary)]">
                          {formatTanggal(p.paid_at)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium text-[var(--text-primary)]">
                          {p.installment_label ?? '—'}
                        </span>
                      </Td>
                      <Td>
                        <span className="chip">
                          {METHOD_LABEL[p.method] ?? p.method}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span className="font-display text-sm font-semibold text-[var(--text-display)]">
                          {formatRupiah(Number(p.amount))}
                        </span>
                      </Td>
                      <Td>
                        <PaymentStatusBadge verified={p.verified} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(50% 80% at 0% 100%, var(--brand-soft) 0%, transparent 60%)',
          }}
        />
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md border bg-[var(--bg-elevated)] text-[var(--brand-ink)]"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Info className="h-3.5 w-3.5" />
            </span>
            <CardTitle className="font-display text-base">
              Cara bayar termin berikutnya
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
            <Step n={1}>
              Tanya pembimbing nominal & rekening tujuan termin yang aktif.
            </Step>
            <Step n={2}>
              Transfer sesuai nominal, simpan bukti (screenshot / foto).
            </Step>
            <Step n={3}>
              Kirim bukti + judul proyek + label termin ke WhatsApp pembimbing.
            </Step>
            <Step n={4}>
              Pembimbing akan memverifikasi, status berubah jadi{' '}
              <span className="font-medium text-[var(--success)]">
                Terverifikasi
              </span>{' '}
              di tabel atas.
            </Step>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'warning' | 'success';
}) {
  const toneClass =
    tone === 'warning'
      ? 'text-[var(--warning)]'
      : tone === 'success'
        ? 'text-[var(--success)]'
        : 'text-[var(--text-display)]';
  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-[var(--bg-subtle)] p-4"
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle, var(--brand-soft) 0%, transparent 70%)',
        }}
      />
      <div className="relative flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md border bg-[var(--bg-elevated)] text-[var(--brand-ink)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {icon}
        </span>
        {label}
      </div>
      <p
        className={`relative mt-2 font-display text-xl font-semibold leading-tight ${toneClass}`}
      >
        {value}
      </p>
      {hint ? (
        <p className="relative mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-ink)]">
        {n}
      </span>
      <p>{children}</p>
    </li>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
