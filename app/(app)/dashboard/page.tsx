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
import { PageHeader } from '@/components/shared/page-header';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { getDashboardSummary } from '@/lib/actions/dashboard';
import { formatRupiah, formatTanggal, formatTanggalRelatif } from '@/lib/format';

export const dynamic = 'force-dynamic';

const MONTH_LABEL_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatMonthShort(month: string) {
  const [y, m] = month.split('-');
  const idx = Number(m) - 1;
  return `${MONTH_LABEL_ID[idx] ?? m} ${y?.slice(2) ?? ''}`;
}

const TODAY_LABEL = (() => {
  const now = new Date();
  return now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
})();

export default async function DashboardHomePage() {
  const result = await getDashboardSummary();
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          kicker="Dashboard"
          title="Ringkasan tidak tersedia"
          description="Tidak bisa memuat data. Coba refresh halaman atau periksa koneksi."
        />
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        kicker={TODAY_LABEL}
        title="Ruang kerja Bimbingo"
        description="Pantau klien, deadline, dan arus pendapatan dalam satu permukaan tenang. Tekan Cmd / Ctrl + K untuk lompat cepat ke mana saja."
        meta={
          <>
            <span className="chip chip-brand">{data.active_clients} klien aktif</span>
            <span className="chip">{data.active_projects} proyek berjalan</span>
            <span className="chip">{data.upcoming_deadlines.length} deadline ≤ 7 hari</span>
          </>
        }
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                Klien baru
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Proyek baru
              </Link>
            </Button>
          </>
        }
      />

      <OnboardingHint
        storageKey="dashboard-intro"
        title="Selamat datang di Bimbingo"
        description="Mulai dari menambah klien → buat proyek → atur milestone & deadline. Setiap tabel punya tombol “Kelola kolom” untuk menambah field kustom sendiri."
        action={
          <>
            <Button asChild size="sm" variant="secondary">
              <Link href="/clients/new">Tambah klien pertama</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/projects">Lihat proyek</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="Klien aktif"
          value={String(data.active_clients)}
          href="/clients"
          hint="Total mahasiswa yang sedang didampingi."
        />
        <Kpi
          icon={FolderKanban}
          label="Proyek aktif"
          value={String(data.active_projects)}
          href="/projects"
          hint="Skripsi berjalan, belum sidang."
        />
        <Kpi
          icon={Wallet}
          label="Pendapatan bulan ini"
          value={formatRupiah(data.revenue_this_month)}
          href="/finance"
          hint="Akumulasi pembayaran tercatat."
        />
        <Kpi
          icon={CreditCard}
          label="Total piutang"
          value={formatRupiah(data.total_outstanding)}
          href="/finance"
          tone={data.total_outstanding > 0 ? 'warning' : 'success'}
          hint="Sisa nilai kontrak belum lunas."
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Deadline mendekat</CardTitle>
              <span className="chip">≤ 7 hari</span>
            </div>
            <CardDescription>5 task paling urgent. Klik untuk masuk ke board proyek.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcoming_deadlines.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                Tidak ada deadline dalam 7 hari ke depan. Tarik napas dulu.
              </p>
            ) : (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.upcoming_deadlines.map((t) => (
                  <li key={t.task_id} className="flex items-start justify-between gap-2 py-2.5">
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
                      <div className="flex items-center justify-end gap-1 text-xs text-[var(--text-secondary)]">
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

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Butuh perhatian</CardTitle>
              <span className="chip">stale &gt; 5 hari</span>
            </div>
            <CardDescription>Proyek aktif yang tidak punya update terbaru.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.stale_projects.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                Semua proyek aktif sudah ter-update belakangan ini.
              </p>
            ) : (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.stale_projects.map((p) => (
                  <li key={p.project_id} className="flex items-start justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${p.project_id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="truncate text-xs text-[var(--text-muted)]">{p.client_name}</p>
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
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">Pendapatan 6 bulan terakhir</CardTitle>
            <span className="chip">grafik ringkas</span>
          </div>
          <CardDescription>
            Detail per metode dan transaksi ada di halaman <Link href="/finance" className="underline">Keuangan</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenue_chart.every((r) => r.total === 0) ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              Belum ada pendapatan tercatat dalam 6 bulan terakhir.
            </p>
          ) : (
            <div className="flex h-44 items-end gap-3">
              {data.revenue_chart.map((r) => {
                const pct = maxRevenue > 0 ? (r.total / maxRevenue) * 100 : 0;
                return (
                  <div key={r.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                      {r.total > 0 ? formatRupiah(r.total) : '—'}
                    </span>
                    <div
                      className="w-full overflow-hidden rounded-t-md"
                      style={{
                        height: `${Math.max(4, pct)}%`,
                        background:
                          'linear-gradient(180deg, var(--brand) 0%, color-mix(in oklab, var(--brand) 75%, transparent) 100%)',
                      }}
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
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  tone?: 'warning' | 'success';
  hint?: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="relative overflow-hidden transition-all group-hover:-translate-y-[1px] group-hover:shadow-[var(--shadow-pop)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px opacity-60"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--brand-soft), transparent)',
          }}
        />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {label}
            </CardDescription>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md border bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          </div>
          <CardTitle
            className="font-display text-3xl leading-tight"
            style={{
              color:
                tone === 'warning'
                  ? 'var(--warning)'
                  : tone === 'success'
                    ? 'var(--success)'
                    : 'var(--text-display)',
            }}
          >
            {value}
          </CardTitle>
          {hint ? (
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{hint}</p>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
