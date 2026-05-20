import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Klien</h1>
      <Card>
        <CardHeader>
          <CardTitle>Belum ada klien</CardTitle>
          <CardDescription>
            Halaman CRUD klien akan dibangun pada Hari 6-7 roadmap (Minggu 2).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]">
          Lihat <code>docs/06-implementation-roadmap.md</code> untuk detail.
        </CardContent>
      </Card>
    </div>
  );
}
