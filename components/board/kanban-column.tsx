'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import {
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  type TaskStatus,
} from '@/lib/schemas/task';
import type { TaskRow } from '@/lib/actions/tasks';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskRow[];
  onTaskClick: (task: TaskRow) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
    data: { type: 'column', status },
  });

  const ids = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Badge tone={TASK_STATUS_TONE[status]}>{TASK_STATUS_LABEL[status]}</Badge>
          <span className="text-xs text-[var(--text-muted)]">{tasks.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Tambah task di ${TASK_STATUS_LABEL[status]}`}
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[60vh] flex-1 flex-col gap-2 rounded-lg border bg-[var(--bg-subtle)] p-2 transition-colors',
          isOver && 'border-[var(--brand)] bg-[var(--brand-soft)]',
        )}
        style={{ borderColor: isOver ? undefined : 'var(--border)' }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              Tarik task ke sini
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
