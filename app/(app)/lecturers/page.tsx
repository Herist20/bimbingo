import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LecturersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dosen</h1>
      <Card>
        <CardHeader>
          <CardTitle>Belum ada dosen</CardTitle>
          <CardDescription>
            Manajemen dosen pembimbing akan dibangun pada Hari 8 roadmap (Minggu 2).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]" />
      </Card>
    </div>
  );
}
