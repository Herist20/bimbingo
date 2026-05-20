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
import { moveTask, type TaskRow } from '@/lib/actions/tasks';

interface KanbanBoardProps {
  projectId: string;
  initialTasks: TaskRow[];
}

export function KanbanBoard({ projectId, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = React.useState<TaskRow[]>(initialTasks);
  const [activeTask, setActiveTask] = React.useState<TaskRow | null>(null);
  const [detailTask, setDetailTask] = React.useState<TaskRow | null>(null);
  const [quickAddStatus, setQuickAddStatus] = React.useState<TaskStatus | null>(null);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
        />
      ) : null}
    </div>
  );
}
