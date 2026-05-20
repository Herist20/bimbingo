import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Proyek</h1>
      <Card>
        <CardHeader>
          <CardTitle>Belum ada proyek</CardTitle>
          <CardDescription>
            Manajemen proyek skripsi akan dibangun pada Hari 9-10 roadmap (Minggu 2).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]" />
      </Card>
    </div>
  );
}
