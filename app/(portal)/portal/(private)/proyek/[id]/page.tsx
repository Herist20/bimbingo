import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  MilestoneList,
  type MilestoneRow,
} from '@/components/portal/milestone-list';
import { formatTanggal } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, status, target_end_date')
    .eq('id', id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: milestones }, { data: progress }] = await Promise.all([
    supabase
      .from('project_milestones')
      .select('id, title, sequence, due_date, status')
      .eq('project_id', id)
      .order('sequence', { ascending: true }),
    supabase
      .from('project_progress_summary')
      .select('progress_percent')
      .eq('project_id', id)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--text-muted)]">Proyek</p>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Progres"
          value={`${Number(progress?.progress_percent ?? 0)}%`}
        />
        <Stat label="Status" value={<Badge>{project.status}</Badge>} />
        <Stat
          label="Target selesai"
          value={project.target_end_date ? formatTanggal(project.target_end_date) : '—'}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Tahapan</h2>
        <MilestoneList milestones={(milestones ?? []) as MilestoneRow[]} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-md border p-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
