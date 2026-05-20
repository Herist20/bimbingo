'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_TONE } from '@/lib/schemas/task';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TaskRow } from '@/lib/actions/tasks';

interface TaskCardProps {
  task: TaskRow;
  onClick?: (task: TaskRow) => void;
  isOverlay?: boolean;
}

export function TaskCard({ task, onClick, isOverlay }: TaskCardProps) {
  const sortable = useSortable({ id: task.id, data: { type: 'task', task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const dueDanger =
    task.due_date && task.status !== 'done' && new Date(task.due_date) <= addDays(new Date(), 3);

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
      onClick={() => onClick?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.(task);
      }}
      className={cn(
        'flex cursor-grab flex-col gap-2 rounded-md border bg-[var(--bg-base)] p-3 text-left shadow-sm transition-shadow active:cursor-grabbing',
        'border-[var(--border)] hover:shadow-md',
        sortable.isDragging && !isOverlay && 'opacity-30',
        isOverlay && 'rotate-1 shadow-lg ring-2 ring-[var(--brand)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <Badge tone={TASK_PRIORITY_TONE[task.priority as keyof typeof TASK_PRIORITY_TONE] ?? 'neutral'}>
          {TASK_PRIORITY_LABEL[task.priority as keyof typeof TASK_PRIORITY_LABEL] ?? task.priority}
        </Badge>
      </div>
      {task.due_date ? (
        <div
          className={cn(
            'inline-flex items-center gap-1 text-xs',
            dueDanger ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]',
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span>{formatTanggal(task.due_date)}</span>
          <span className="text-[10px]">· {formatTanggalRelatif(task.due_date)}</span>
        </div>
      ) : null}
    </div>
  );
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
