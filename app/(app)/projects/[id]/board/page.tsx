import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { KanbanBoard } from '@/components/board/kanban-board';
import { getProject } from '@/lib/actions/projects';
import { listTasksByProject } from '@/lib/actions/tasks';

export const dynamic = 'force-dynamic';

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [projectResult, tasksResult] = await Promise.all([
    getProject(id),
    listTasksByProject(id),
  ]);

  if (!projectResult.ok || !projectResult.data) notFound();
  const { project } = projectResult.data;
  const tasks = tasksResult.ok ? tasksResult.data : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Detail proyek
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Board task. Tarik kartu antar kolom untuk ubah status. Klik kartu untuk edit detail.
        </p>
      </div>

      <KanbanBoard projectId={id} initialTasks={tasks} />
    </div>
  );
}
