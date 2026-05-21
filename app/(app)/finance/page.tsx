import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobalPaymentsTable } from '@/components/payments/global-payments-table';
import { PageHeader } from '@/components/shared/page-header';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { listPaymentsRange, summarizeFinance } from '@/lib/actions/payments';
import { formatRupiah } from '@/lib/format';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/schemas/payment';

export const dynamic = 'force-dynamic';

function thisMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toISO(from), to: toISO(to) };
}

function ytdRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

function last12MonthsRange() {
  const now = new Date();
  const from = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
  return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

const MONTH_LABEL_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatMonthLabel(month: string) {
  const [y, m] = month.split('-');
  const idx = Number(m) - 1;
  return `${MONTH_LABEL_ID[idx] ?? m} ${y?.slice(2) ?? ''}`;
}

export default async function FinanceGlobalPage() {
  const monthRange = thisMonthRange();
  const ytd = ytdRange();
  const range12 = last12MonthsRange();

  const [monthSummary, ytdSummary, chartSummary, allPayments] = await Promise.all([
    summarizeFinance(monthRange),
    summarizeFinance(ytd),
    summarizeFinance(range12),
    listPaymentsRange(range12),
  ]);

  const monthTotal = monthSummary.ok ? monthSummary.data.total : 0;
  const ytdTotal = ytdSummary.ok ? ytdSummary.data.total : 0;
  const byMethod = monthSummary.ok ? monthSummary.data.byMethod : null;
  const byMonth = chartSummary.ok ? chartSummary.data.byMonth : [];
  const payments = allPayments.ok ? allPayments.data : [];

  const maxMonth = byMonth.reduce((m, p) => Math.max(m, p.total), 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        kicker="Operasional · Keuangan"
        title="Ringkasan kas"
        description="Data dihitung dari pembayaran tercatat per proyek. Untuk catat transaksi baru, masuk ke tab Keuangan di detail proyek."
        meta={
          <>
            <span className="chip chip-brand">{formatRupiah(monthTotal)} bulan ini</span>
            <span className="chip">{payments.length} transaksi 12 bulan</span>
          </>
        }
      />

      <OnboardingHint
        storageKey="finance-intro"
        title="Cara mencatat termin"
        description="Pembayaran dicatat per proyek: buka detail proyek → tab Keuangan → Catat pembayaran. Verifikasi-kan jika bukti sudah cocok dengan mutasi rekening."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="text-[11px] uppercase tracking-[0.12em]">
              Pendapatan bulan ini
            </CardDescription>
            <CardTitle className="font-display text-3xl">{formatRupiah(monthTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-[11px] uppercase tracking-[0.12em]">
              Pendapatan YTD
            </CardDescription>
            <CardTitle className="font-display text-3xl">{formatRupiah(ytdTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-[11px] uppercase tracking-[0.12em]">
              Transaksi 12 bulan
            </CardDescription>
            <CardTitle className="font-display text-3xl">{payments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendapatan per bulan (12 bulan terakhir)</CardTitle>
          <CardDescription>Chart sederhana tanpa library tambahan.</CardDescription>
        </CardHeader>
        <CardContent>
          {byMonth.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              Belum ada data pembayaran 12 bulan terakhir.
            </p>
          ) : (
            <div className="flex h-48 items-end gap-2">
              {byMonth.map((m) => {
                const pct = maxMonth > 0 ? (m.total / maxMonth) * 100 : 0;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[var(--brand)]"
                      style={{ height: `${pct}%` }}
                      title={formatRupiah(m.total)}
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatMonthLabel(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {byMethod ? (
        <Card>
          <CardHeader>
            <CardTitle>Per metode (bulan ini)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-5">
            {(Object.keys(byMethod) as PaymentMethod[]).map((m) => (
              <div key={m} className="flex flex-col gap-0.5 rounded-md border p-3" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs text-[var(--text-muted)]">{PAYMENT_METHOD_LABEL[m]}</span>
                <span className="text-sm font-medium">{formatRupiah(byMethod[m])}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Transaksi 12 bulan terakhir</CardTitle>
          <CardDescription>Klik proyek untuk masuk ke tab Finance proyek tersebut.</CardDescription>
        </CardHeader>
        <CardContent>
          <GlobalPaymentsTable data={payments} />
        </CardContent>
      </Card>
    </div>
  );
}
