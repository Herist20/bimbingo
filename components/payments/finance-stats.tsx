import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/format';

interface FinanceStatsProps {
  totalValue: number;
  totalPaid: number;
  outstanding: number;
  paymentCount: number;
}

export function FinanceStats({
  totalValue,
  totalPaid,
  outstanding,
  paymentCount,
}: FinanceStatsProps) {
  const pct = totalValue > 0 ? Math.min(100, Math.round((totalPaid / totalValue) * 100)) : 0;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Total Kontrak</CardDescription>
          <CardTitle className="text-2xl">{formatRupiah(totalValue)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Sudah Dibayar</CardDescription>
          <CardTitle className="text-2xl">
            <span>{formatRupiah(totalPaid)}</span>
            <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
              {paymentCount}x
            </span>
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--brand)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{pct}% terbayar</p>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Sisa Piutang</CardDescription>
          <CardTitle
            className="text-2xl"
            style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}
          >
            {formatRupiah(Math.max(0, outstanding))}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Status</CardDescription>
          <CardTitle
            className="text-2xl"
            style={{ color: outstanding <= 0 ? 'var(--success)' : undefined }}
          >
            {outstanding <= 0 ? 'Lunas' : 'Aktif'}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
