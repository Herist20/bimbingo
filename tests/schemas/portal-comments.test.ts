import { describe, expect, it } from 'vitest';
import { PostMilestoneCommentSchema } from '@/lib/schemas/portal-comments';

describe('PostMilestoneCommentSchema', () => {
  it('accepts valid uuid + body', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
      body: 'Hallo pak, mau tanya bab 3.',
    });
    expect(r.success).toBe(true);
  });
  it('rejects empty body', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
      body: '   ',
    });
    expect(r.success).toBe(false);
  });
  it('rejects body > 2000 char', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
      body: 'x'.repeat(2001),
    });
    expect(r.success).toBe(false);
  });
  it('rejects non-uuid milestoneId', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'not-uuid',
      body: 'halo',
    });
    expect(r.success).toBe(false);
  });
});
