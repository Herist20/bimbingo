'use client';

import { useEffect, useState, useTransition } from 'react';

import { CommentBubble } from './comment-bubble';
import { PostCommentBox } from './post-comment-box';
import { listMilestoneComments } from '@/lib/actions/portal-comments';
import type { MilestoneCommentRow } from '@/lib/schemas/portal-comments';

export function CommentThread({
  milestoneId,
  currentUserId,
}: {
  milestoneId: string;
  currentUserId: string;
}) {
  const [comments, setComments] = useState<MilestoneCommentRow[] | null>(null);
  const [, start] = useTransition();

  function reload() {
    start(async () => {
      const res = await listMilestoneComments(milestoneId);
      if (res.ok) setComments(res.data);
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneId]);

  return (
    <div className="space-y-3">
      {comments === null ? (
        <p className="text-xs text-[var(--text-muted)]">Memuat diskusi…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Belum ada komentar. Mulai pertanyaan dengan kotak di bawah.
        </p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <CommentBubble
              key={c.id}
              comment={c}
              isMine={c.author_id === currentUserId}
            />
          ))}
        </div>
      )}
      <PostCommentBox milestoneId={milestoneId} onPosted={reload} />
    </div>
  );
}
