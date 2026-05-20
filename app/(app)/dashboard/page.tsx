import Link from 'next/link';
import { CalendarClock, CreditCard, FolderKanban, Plus, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getDashboardSummary } from '@/lib/actions/dashboard';
import { formatRupiah, formatTanggal, formatTanggalRelatif } from '@/lib/format';

export const dynamic = 'force-dynamic';

const MONTH_LABEL_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatMonthShort(month: string) {
  const [y, m] = month.split('-');
  const idx = Number(m) - 1;
  return `${MONTH_LABEL_ID[idx] ?? m} ${y?.slice(2) ?? ''}`;
}

export default async function DashboardHomePage() {
  const result = await getDashboardSummary();
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat ringkasan</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const data = result.data;
  const maxRevenue = data.revenue_chart.reduce((m, r) => Math.max(m, r.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Ringkasan operasional Bimbingo Anda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Klien baru
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              Proyek baru
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="Klien Aktif"
          value={String(data.active_clients)}
          href="/clients"
        />
        <Kpi
          icon={FolderKanban}
          label="Proyek Aktif"
          value={String(data.active_projects)}
          href="/projects"
        />
        <Kpi
          icon={Wallet}
          label="Pendapatan Bulan Ini"
          value={formatRupiah(data.revenue_this_month)}
          href="/finance"
        />
        <Kpi
          icon={CreditCard}
          label="Total Piutang"
          value={formatRupiah(data.total_outstanding)}
          href="/finance"
          tone={data.total_outstanding > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deadline mendekat</CardTitle>
            <CardDescription>5 task dengan deadline ≤ 7 hari.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcoming_deadlines.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                Tidak ada deadline mendekat dalam 7 hari ke depan.
              </p>
            ) : (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.upcoming_deadlines.map((t) => (
                  <li key={t.task_id} className="flex items-start justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${t.project_id}/board`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {t.title}
                      </Link>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {t.client_name} · {t.project_title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatTanggal(t.due_date)}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {formatTanggalRelatif(t.due_date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proyek butuh perhatian</CardTitle>
            <CardDescription>Aktif tapi tidak ada update lebih dari 5 hari.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.stale_projects.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                Semua proyek aktif sudah ter-update belakangan ini.
              </p>
            ) : (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.stale_projects.map((p) => (
                  <li key={p.project_id} className="flex items-start justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${p.project_id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {p.client_name}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-[var(--text-secondary)]">
                      {formatTanggalRelatif(p.updated_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendapatan 6 bulan terakhir</CardTitle>
          <CardDescription>Bar chart sederhana — detail di halaman Finance.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenue_chart.every((r) => r.total === 0) ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              Belum ada pendapatan tercatat dalam 6 bulan terakhir.
            </p>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {data.revenue_chart.map((r) => {
                const pct = maxRevenue > 0 ? (r.total / maxRevenue) * 100 : 0;
                return (
                  <div key={r.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {r.total > 0 ? formatRupiah(r.total) : '—'}
                    </span>
                    <div
                      className="w-full rounded-t bg-[var(--brand)]"
                      style={{ height: `${Math.max(2, pct)}%` }}
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatMonthShort(r.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  tone?: 'warning' | 'success';
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-[var(--bg-muted)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>{label}</CardDescription>
            <Icon className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <CardTitle
            className="text-3xl"
            style={{
              color:
                tone === 'warning'
                  ? 'var(--warning)'
                  : tone === 'success'
                    ? 'var(--success)'
                    : undefined,
            }}
          >
            {value}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
