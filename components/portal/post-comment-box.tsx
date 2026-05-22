'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { postMilestoneComment } from '@/lib/actions/portal-comments';

export function PostCommentBox({
  milestoneId,
  onPosted,
}: {
  milestoneId: string;
  onPosted: () => void;
}) {
  const [body, setBody] = useState('');
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    start(async () => {
      const res = await postMilestoneComment({ milestoneId, body: trimmed });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      setBody('');
      onPosted();
    });
  }

  const remaining = 2000 - body.length;
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Tulis komentar atau pertanyaan…"
        className="w-full resize-y rounded-md border px-3 py-2 text-sm"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      />
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{remaining} karakter tersisa</span>
        <Button
          type="submit"
          size="sm"
          disabled={pending || body.trim().length === 0}
        >
          {pending ? 'Mengirim…' : 'Kirim komentar'}
        </Button>
      </div>
    </form>
  );
}
