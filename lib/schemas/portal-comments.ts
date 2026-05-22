import { z } from 'zod';

export const PostMilestoneCommentSchema = z.object({
  milestoneId: z.string().uuid('Milestone ID tidak valid'),
  body: z
    .string()
    .trim()
    .min(1, 'Komentar tidak boleh kosong')
    .max(2000, 'Maksimal 2000 karakter'),
});
export type PostMilestoneCommentInput = z.infer<typeof PostMilestoneCommentSchema>;

export type MilestoneCommentRow = {
  id: string;
  author_id: string | null;
  author_role: 'admin' | 'client';
  author_name: string;
  body: string;
  created_at: string;
};
