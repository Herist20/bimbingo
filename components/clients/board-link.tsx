import Link from 'next/link';
import { KanbanSquare } from 'lucide-react';

export function BoardLink({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/projects/${projectId}/board`}
      className="inline-flex h-7 items-center gap-1 rounded-md border bg-[var(--bg-base)] px-2 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <KanbanSquare className="h-3 w-3" />
      Board
    </Link>
  );
}
