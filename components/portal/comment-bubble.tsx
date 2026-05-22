import { formatTanggal } from '@/lib/format';
import type { MilestoneCommentRow } from '@/lib/schemas/portal-comments';

export function CommentBubble({
  comment,
  isMine,
}: {
  comment: MilestoneCommentRow;
  isMine: boolean;
}) {
  return (
    <div className={isMine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className="max-w-[85%] rounded-lg border px-3 py-2 text-sm"
        style={{
          backgroundColor: isMine ? 'var(--brand-soft)' : 'var(--bg-elevated)',
          borderColor: isMine ? 'transparent' : 'var(--border)',
          color: isMine ? 'var(--brand-ink)' : 'var(--text-primary)',
        }}
      >
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
          <span className="font-semibold">{comment.author_name}</span>
          <span className="text-[var(--text-muted)]">
            · {comment.author_role === 'admin' ? 'Pembimbing' : 'Klien'}
          </span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{comment.body}</p>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          {formatTanggal(comment.created_at)}
        </p>
      </div>
    </div>
  );
}
