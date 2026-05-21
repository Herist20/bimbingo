'use client';

import * as React from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import type { TaskRow } from '@/lib/actions/tasks';

type TaskRecord = {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  order_index: number;
  custom_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function toTaskRow(rec: TaskRecord): TaskRow {
  return {
    id: rec.id,
    project_id: rec.project_id,
    milestone_id: rec.milestone_id,
    title: rec.title,
    description: rec.description,
    status: rec.status,
    priority: rec.priority,
    assignee_id: rec.assignee_id,
    due_date: rec.due_date,
    completed_at: rec.completed_at,
    order_index: rec.order_index,
    custom_data: (rec.custom_data ?? {}) as Record<string, unknown>,
    created_at: rec.created_at,
    updated_at: rec.updated_at,
  };
}

export type RealtimeStatus = 'idle' | 'connecting' | 'live' | 'error';

/**
 * Subscribe ke perubahan tabel `tasks` untuk satu proyek via Supabase Realtime.
 * Merge event ke local state — server-side update menang (compare updated_at).
 *
 * @param projectId  filter event hanya untuk project_id ini
 * @param initial    snapshot awal dari server (initial render)
 */
export function useRealtimeTasks(projectId: string, initial: TaskRow[]) {
  const [tasks, setTasks] = React.useState<TaskRow[]>(initial);
  const [status, setStatus] = React.useState<RealtimeStatus>('idle');

  // Resync saat initial berubah (mis. router.refresh setelah action).
  React.useEffect(() => {
    setTasks(initial);
  }, [initial]);

  React.useEffect(() => {
    if (!projectId) return;

    const supabase = getBrowserSupabase();
    setStatus('connecting');

    const channel = supabase
      .channel(`tasks:project=${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = toTaskRow(payload.new as TaskRecord);
          setTasks((prev) => {
            if (prev.some((t) => t.id === row.id)) return prev; // sudah ada (echo)
            return [...prev, row];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = toTaskRow(payload.new as TaskRecord);
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id !== row.id) return t;
              // Server-side menang. Skip jika updated_at sama atau lebih lama dari yang sudah ada.
              if (new Date(row.updated_at).getTime() < new Date(t.updated_at).getTime()) {
                return t;
              }
              return row;
            }),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (!oldRow.id) return;
          setTasks((prev) => prev.filter((t) => t.id !== oldRow.id));
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') setStatus('live');
        else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          setStatus('error');
        } else if (channelStatus === 'CLOSED') {
          setStatus('idle');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { tasks, setTasks, status };
}
