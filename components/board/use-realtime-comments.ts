'use client';

import * as React from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { listTaskComments, type TaskCommentRow } from '@/lib/actions/tasks';

type CommentRecord = {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

function toCommentRow(rec: CommentRecord): TaskCommentRow {
  return {
    id: rec.id,
    task_id: rec.task_id,
    author_id: rec.author_id,
    body: rec.body,
    created_at: rec.created_at,
  };
}

export type RealtimeStatus = 'idle' | 'loading' | 'connecting' | 'live' | 'error';

/**
 * Fetch initial + subscribe channel realtime untuk komentar pada satu task.
 * Server-wins via id dedupe; order created_at descending (terbaru di atas).
 */
export function useRealtimeComments(taskId: string | null) {
  const [comments, setComments] = React.useState<TaskCommentRow[]>([]);
  const [status, setStatus] = React.useState<RealtimeStatus>('idle');

  // Initial fetch saat taskId berubah / non-null
  React.useEffect(() => {
    if (!taskId) {
      setComments([]);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    listTaskComments(taskId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setComments(result.data);
        setStatus('connecting');
      } else {
        setStatus('error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  // Realtime subscribe
  React.useEffect(() => {
    if (!taskId) return;
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`task_comments:task=${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const row = toCommentRow(payload.new as CommentRecord);
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (!oldRow.id) return;
          setComments((prev) => prev.filter((c) => c.id !== oldRow.id));
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') setStatus('live');
        else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          setStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  return { comments, setComments, status };
}
