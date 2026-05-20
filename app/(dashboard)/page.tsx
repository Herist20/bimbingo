import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Ringkasan operasional Bimbingo Anda akan tampil di sini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Klien Aktif', value: '—' },
          { label: 'Proyek Aktif', value: '—' },
          { label: 'Pendapatan Bulan Ini', value: 'Rp 0' },
          { label: 'Total Piutang', value: 'Rp 0' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-3xl">{kpi.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selamat datang</CardTitle>
          <CardDescription>
            Halaman ini akan diisi pada Minggu 4 roadmap. Lihat
            <code className="mx-1 rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs">
              docs/06-implementation-roadmap.md
            </code>
            untuk timeline harian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">
            Mulai dengan menambah klien pertama Anda di menu <strong>Klien</strong> (akan
            tersedia Hari 7 roadmap).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
