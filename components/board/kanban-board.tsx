'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { TaskDetailSheet } from './task-detail-sheet';
import { TaskQuickAdd } from './task-quick-add';
import { TASK_STATUSES, type TaskStatus } from '@/lib/schemas/task';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';
import { moveTask, type TaskRow } from '@/lib/actions/tasks';
import { useRealtimeTasks } from './use-realtime-tasks';
import type { RecentChange } from './task-card';
import { cn } from '@/lib/utils';

const FLASH_TTL_MS = 3600;

interface KanbanBoardProps {
  projectId: string;
  initialTasks: TaskRow[];
  customFields?: CustomFieldRow[];
}

export function KanbanBoard({ projectId, initialTasks, customFields = [] }: KanbanBoardProps) {
  const { tasks, setTasks, status: realtimeStatus } = useRealtimeTasks(projectId, initialTasks);
  const [activeTask, setActiveTask] = React.useState<TaskRow | null>(null);
  const [detailTask, setDetailTask] = React.useState<TaskRow | null>(null);
  const [quickAddStatus, setQuickAddStatus] = React.useState<TaskStatus | null>(null);
  const [recentChanges, setRecentChanges] = React.useState<Map<string, RecentChange>>(new Map());

  // Detect status changes vs previous render → pulse indicator
  const prevSnapshotRef = React.useRef<Map<string, string>>(
    new Map(initialTasks.map((t) => [t.id, t.status])),
  );

  React.useEffect(() => {
    const prev = prevSnapshotRef.current;
    const next = new Map<string, string>();
    const additions: Array<[string, RecentChange]> = [];
    const now = Date.now();
    for (const t of tasks) {
      next.set(t.id, t.status);
      const prevStatus = prev.get(t.id);
      if (prevStatus && prevStatus !== t.status) {
        additions.push([t.id, { from: prevStatus, to: t.status, at: now }]);
      }
    }
    prevSnapshotRef.current = next;
    if (additions.length === 0) return;
    setRecentChanges((curr) => {
      const merged = new Map(curr);
      for (const [id, change] of additions) merged.set(id, change);
      return merged;
    });
  }, [tasks]);

  // Cleanup expired entries
  React.useEffect(() => {
    if (recentChanges.size === 0) return;
    const earliest = Math.min(...Array.from(recentChanges.values()).map((c) => c.at));
    const delay = Math.max(50, FLASH_TTL_MS - (Date.now() - earliest));
    const timer = window.setTimeout(() => {
      setRecentChanges((curr) => {
        const now = Date.now();
        const next = new Map<string, RecentChange>();
        for (const [id, c] of curr) {
          if (now - c.at < FLASH_TTL_MS) next.set(id, c);
        }
        return next.size === curr.size ? curr : next;
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [recentChanges]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByStatus = React.useMemo(() => {
    const map = new Map<TaskStatus, TaskRow[]>();
    for (const s of TASK_STATUSES) map.set(s, []);
    for (const t of [...tasks].sort((a, b) => a.order_index - b.order_index)) {
      const list = map.get(t.status as TaskStatus);
      if (list) list.push(t);
    }
    return map;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const dragged = tasks.find((t) => t.id === active.id);
    if (!dragged) return;

    // Drop ke kolom (kosong atau header) ATAU drop ke task lain
    const overData = over.data.current as { type?: string; status?: TaskStatus; task?: TaskRow } | undefined;
    let toStatus: TaskStatus = dragged.status as TaskStatus;
    let beforeId: string | null = null;
    let afterId: string | null = null;

    if (overData?.type === 'column' && overData.status) {
      toStatus = overData.status;
      const colTasks = tasksByStatus.get(toStatus) ?? [];
      const last = colTasks[colTasks.length - 1];
      beforeId = last && last.id !== dragged.id ? last.id : null;
      afterId = null;
    } else if (overData?.type === 'task' && overData.task) {
      const overTask = overData.task;
      toStatus = overTask.status as TaskStatus;
      const colTasks = (tasksByStatus.get(toStatus) ?? []).filter((t) => t.id !== dragged.id);
      const idx = colTasks.findIndex((t) => t.id === overTask.id);
      if (idx === -1) {
        beforeId = colTasks[colTasks.length - 1]?.id ?? null;
      } else {
        beforeId = colTasks[idx - 1]?.id ?? null;
        afterId = colTasks[idx]?.id ?? null;
      }
    } else {
      return;
    }

    // Optimistic update
    const previous = tasks;
    setTasks((prev) => {
      // Hitung order_index baru sederhana untuk UI (server akan return value final).
      const others = prev.filter((t) => t.id !== dragged.id);
      const colTasks = others
        .filter((t) => t.status === toStatus)
        .sort((a, b) => a.order_index - b.order_index);

      let newOrder = 1000;
      if (beforeId && afterId) {
        const b = colTasks.find((t) => t.id === beforeId);
        const a = colTasks.find((t) => t.id === afterId);
        if (b && a) newOrder = (b.order_index + a.order_index) / 2;
      } else if (beforeId) {
        const b = colTasks.find((t) => t.id === beforeId);
        if (b) newOrder = b.order_index + 1000;
      } else if (afterId) {
        const a = colTasks.find((t) => t.id === afterId);
        if (a) newOrder = a.order_index - 1000;
      } else {
        const last = colTasks[colTasks.length - 1];
        newOrder = last ? last.order_index + 1000 : 1000;
      }

      return others.concat([{ ...dragged, status: toStatus, order_index: newOrder }]);
    });

    const result = await moveTask({ taskId: dragged.id, toStatus, beforeId, afterId });
    if (!result.ok) {
      toast.error(result.error.message);
      setTasks(previous);
      return;
    }
    // Sinkron dengan nilai final server (order_index pasti)
    setTasks((prev) => prev.map((t) => (t.id === result.data.id ? result.data : t)));
  }

  return (
    <div className="flex flex-col gap-4">
      <RealtimeIndicator status={realtimeStatus} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus.get(status) ?? []}
              onTaskClick={(t) => setDetailTask(t)}
              onAddTask={(s) => setQuickAddStatus(s)}
              recentChanges={recentChanges}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {detailTask ? (
        <TaskDetailSheet
          task={detailTask}
          open={Boolean(detailTask)}
          onOpenChange={(o) => !o && setDetailTask(null)}
          onTaskChanged={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          }}
          onTaskDeleted={(id) => {
            setTasks((prev) => prev.filter((t) => t.id !== id));
            setDetailTask(null);
          }}
          customFields={customFields}
        />
      ) : null}

      {quickAddStatus ? (
        <TaskQuickAdd
          projectId={projectId}
          status={quickAddStatus}
          open={Boolean(quickAddStatus)}
          onOpenChange={(o) => !o && setQuickAddStatus(null)}
          onCreated={(t) => {
            setTasks((prev) => [...prev, t]);
            setQuickAddStatus(null);
          }}
          customFields={customFields}
        />
      ) : null}
    </div>
  );
}

function RealtimeIndicator({ status }: { status: 'idle' | 'connecting' | 'live' | 'error' }) {
  const config = {
    idle: { label: 'Offline', dotClass: 'bg-[var(--text-muted)]', ping: false },
    connecting: { label: 'Menyambung…', dotClass: 'bg-[var(--warning)]', ping: false },
    live: { label: 'Sinkron langsung', dotClass: 'bg-[var(--success)]', ping: true },
    error: { label: 'Gagal sinkron', dotClass: 'bg-[var(--danger)]', ping: false },
  }[status];

  return (
    <div
      className="inline-flex w-fit items-center gap-2 rounded-full border bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
      style={{ borderColor: 'var(--border)' }}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2">
        {config.ping ? (
          <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', config.dotClass)} />
        ) : null}
        <span className={cn('relative h-2 w-2 rounded-full', config.dotClass)} />
      </span>
      {config.label}
      <span className="font-mono text-[9px] text-[var(--text-muted)]">·</span>
      <span className="font-mono text-[9px] text-[var(--text-muted)]">
        Tarik kartu antar kolom · perubahan tampil di tab lain
      </span>
    </div>
  );
}

