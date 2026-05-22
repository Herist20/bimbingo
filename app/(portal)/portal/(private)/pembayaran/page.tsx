import { PaymentStatusBadge } from '@/components/portal/payment-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
  const outstanding = totalValue - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Pembayaran</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Daftar tagihan dan pembayaran yang sudah tercatat.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Total tagihan" value={formatRupiah(totalValue)} />
        <KPI label="Sudah dibayar" value={formatRupiah(totalPaid)} />
        <KPI
          label="Sisa"
          value={formatRupiah(outstanding)}
          tone={outstanding > 0 ? 'warning' : 'success'}
        />
      </div>

      {(payments ?? []).length === 0 ? (
        <EmptyState
          title="Belum ada pembayaran tercatat"
          description="Pembayaran yang Anda lakukan akan muncul di sini setelah dicatat admin."
        />
      ) : (
        <div
          className="overflow-x-auto rounded-md border"
          style={{ borderColor: 'var(--border)' }}
        >
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)]">
              <tr className="text-left">
                <Th>Tanggal</Th>
                <Th>Termin</Th>
                <Th>Metode</Th>
                <Th className="text-right">Jumlah</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <Td>{formatTanggal(p.paid_at)}</Td>
                  <Td>{p.installment_label ?? '—'}</Td>
                  <Td>{p.method}</Td>
                  <Td className="text-right">{formatRupiah(Number(p.amount))}</Td>
                  <Td>
                    <PaymentStatusBadge verified={p.verified} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-xs font-medium text-[var(--text-muted)] ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function KPI({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'warning' | 'success';
}) {
  const color =
    tone === 'warning'
      ? 'text-[var(--warning)]'
      : tone === 'success'
        ? 'text-[var(--success)]'
        : '';
  return (
    <div
      className="rounded-md border p-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1 text-base font-semibold ${color}`}>{value}</p>
    </div>
  );
}
