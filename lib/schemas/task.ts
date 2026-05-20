import { z } from 'zod';

export const TASK_STATUSES = [
  'backlog',
  'in-progress',
  'review-dosen',
  'revisi',
  'done',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'Pengerjaan',
  'review-dosen': 'Review Dosen',
  revisi: 'Revisi',
  done: 'Selesai',
};

export const TASK_STATUS_TONE: Record<TaskStatus, 'neutral' | 'brand' | 'warning' | 'success' | 'danger'> = {
  backlog: 'neutral',
  'in-progress': 'brand',
  'review-dosen': 'warning',
  revisi: 'warning',
  done: 'success',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Mendesak',
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, 'neutral' | 'brand' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'brand',
  high: 'warning',
  urgent: 'danger',
};

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v))
  .refine(
    (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
    'Format tanggal harus YYYY-MM-DD',
  );

export const TaskCreateSchema = z.object({
  project_id: z.string().uuid(),
  milestone_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, 'Judul wajib').max(200),
  description: optionalString(2000),
  status: z.enum(TASK_STATUSES).default('backlog'),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: optionalDate,
});
export type TaskCreateInput = z.input<typeof TaskCreateSchema>;

export const TaskUpdateSchema = TaskCreateSchema.partial().omit({ project_id: true });
export type TaskUpdateInput = z.input<typeof TaskUpdateSchema>;

export const TaskCommentSchema = z.object({
  task_id: z.string().uuid(),
  body: z.string().trim().min(1, 'Komentar wajib').max(5000),
});
