import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Belum ada transaksi</CardTitle>
          <CardDescription>
            Pencatatan pembayaran & ringkasan finansial akan dibangun pada Hari 16-17 roadmap (Minggu 4).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]" />
      </Card>
    </div>
  );
}
