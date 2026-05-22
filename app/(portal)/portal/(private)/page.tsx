import { ProjectCard, type ProjectCardProps } from '@/components/portal/project-card';
import { EmptyState } from '@/components/shared/empty-state';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function fetchProjects(): Promise<ProjectCardProps[]> {
  const supabase = await getServerSupabase();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const [{ data: progress }, { data: finance }, { data: nextMilestones }] = await Promise.all([
    supabase
      .from('project_progress_summary')
      .select('project_id, progress_percent')
      .in('project_id', projectIds),
    supabase
      .from('project_finance_summary')
      .select('project_id, total_paid, total_value')
      .in('project_id', projectIds),
    supabase
      .from('project_milestones')
      .select('project_id, title, due_date, status, sequence')
      .in('project_id', projectIds)
      .not('status', 'in', '(approved,done)')
      .order('sequence', { ascending: true }),
  ]);

  const progressBy = new Map<string, number>();
  for (const r of progress ?? []) {
    if (r.project_id) progressBy.set(r.project_id, Number(r.progress_percent ?? 0));
  }
  const financeBy = new Map<string, { paid: number; value: number }>();
  for (const r of finance ?? []) {
    if (r.project_id) {
      financeBy.set(r.project_id, {
        paid: Number(r.total_paid ?? 0),
        value: Number(r.total_value ?? 0),
      });
    }
  }
  const nextBy = new Map<string, { title: string; due_date: string | null }>();
  for (const m of nextMilestones ?? []) {
    if (!nextBy.has(m.project_id)) {
      nextBy.set(m.project_id, { title: m.title, due_date: m.due_date });
    }
  }

  return projects.map((p) => {
    const fin = financeBy.get(p.id);
    const next = nextBy.get(p.id);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      progressPercent: progressBy.get(p.id) ?? 0,
      nextMilestoneTitle: next?.title ?? null,
      nextMilestoneDue: next?.due_date ?? null,
      totalPaid: fin?.paid ?? 0,
      totalValue: fin?.value ?? 0,
    };
  });
}

export default async function PortalDashboardPage() {
  const projects = await fetchProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Pantau progres proyek skripsi Anda.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Belum ada proyek aktif"
          description="Hubungi pembimbing Anda untuk informasi lebih lanjut."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}
