'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRight, CalendarClock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  type TaskStatus,
} from '@/lib/schemas/task';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TaskRow } from '@/lib/actions/tasks';

export interface RecentChange {
  from: string;
  to: string;
  at: number;
}

interface TaskCardProps {
  task: TaskRow;
  onClick?: (task: TaskRow) => void;
  isOverlay?: boolean;
  recentChange?: RecentChange;
}

export function TaskCard({ task, onClick, isOverlay, recentChange }: TaskCardProps) {
  const sortable = useSortable({ id: task.id, data: { type: 'task', task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const dueDanger =
    task.due_date && task.status !== 'done' && new Date(task.due_date) <= addDays(new Date(), 3);

  // key change saat status berubah supaya animation restart
  const flashKey = recentChange ? `${recentChange.to}-${recentChange.at}` : 'idle';

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
      data-recent-change={recentChange ? 'true' : undefined}
      className={cn(
        'relative flex cursor-grab flex-col gap-2 rounded-md border bg-[var(--bg-base)] p-3 text-left shadow-sm transition-shadow active:cursor-grabbing',
        'border-[var(--border)] hover:shadow-md',
        sortable.isDragging && !isOverlay && 'opacity-30',
        isOverlay && 'rotate-1 shadow-lg ring-2 ring-[var(--brand)]',
        recentChange && !isOverlay && 'task-flash',
      )}
      key={flashKey}
    >
      {recentChange && !isOverlay ? (
        <span
          className="status-chip-pop pointer-events-none absolute -top-2.5 left-2 inline-flex items-center gap-1 rounded-full border bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium shadow-[var(--shadow-pop)]"
          style={{
            borderColor: toneToBorder(recentChange.to as TaskStatus),
            color: toneToText(recentChange.to as TaskStatus),
          }}
          aria-live="polite"
        >
          <Sparkles className="h-2.5 w-2.5" />
          <span className="text-[var(--text-muted)]">
            {TASK_STATUS_LABEL[recentChange.from as TaskStatus] ?? recentChange.from}
          </span>
          <ArrowRight className="h-2.5 w-2.5 text-[var(--text-muted)]" />
          <span>{TASK_STATUS_LABEL[recentChange.to as TaskStatus] ?? recentChange.to}</span>
        </span>
      ) : null}

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

function toneToBorder(status: TaskStatus) {
  const tone = TASK_STATUS_TONE[status];
  switch (tone) {
    case 'brand':
      return 'var(--brand)';
    case 'success':
      return 'var(--success)';
    case 'warning':
      return 'var(--warning)';
    case 'danger':
      return 'var(--danger)';
    default:
      return 'var(--border-strong)';
  }
}

function toneToText(status: TaskStatus) {
  const tone = TASK_STATUS_TONE[status];
  switch (tone) {
    case 'brand':
      return 'var(--brand-ink)';
    case 'success':
      return 'var(--success)';
    case 'warning':
      return 'var(--warning)';
    case 'danger':
      return 'var(--danger)';
    default:
      return 'var(--text-primary)';
  }
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
