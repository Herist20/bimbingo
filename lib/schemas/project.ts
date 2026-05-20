import { z } from 'zod';

export const PROJECT_TYPES = [
  'skripsi',
  'tesis',
  'disertasi',
  'tugas-akhir',
  'jurnal',
  'revisi',
] as const;

export const PROJECT_STATUSES = [
  'draft',
  'active',
  'on-hold',
  'completed',
  'cancelled',
] as const;

export const MILESTONE_STATUSES = [
  'not-started',
  'in-progress',
  'submitted',
  'revisi',
  'approved',
  'done',
] as const;

export const LECTURER_ROLES = [
  'pembimbing-1',
  'pembimbing-2',
  'penguji-1',
  'penguji-2',
  'penguji-3',
] as const;
export type LecturerRole = (typeof LECTURER_ROLES)[number];

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

export const MilestoneInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Judul wajib').max(200),
  sequence: z.coerce.number().int().min(1).max(50),
  due_date: optionalDate,
  weight_percent: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === '' || v === undefined || v === null) return undefined;
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? n : undefined;
    })
    .pipe(z.number().int().min(0).max(100).optional()),
  status: z.enum(MILESTONE_STATUSES).optional(),
  notes: optionalString(2000),
});
export type MilestoneInput = z.input<typeof MilestoneInputSchema>;

export const LecturerAssignmentSchema = z.object({
  lecturer_id: z.string().uuid(),
  role: z.enum(LECTURER_ROLES),
});

export const ProjectCreateSchema = z.object({
  client_id: z.string().uuid('Pilih klien terlebih dahulu'),
  title: z.string().trim().min(2).max(200),
  type: z.enum(PROJECT_TYPES).default('skripsi'),
  description: optionalString(2000),
  total_value: z
    .union([z.number(), z.string()])
    .transform((v) => {
      if (v === '' || v === undefined || v === null) return 0;
      const n = typeof v === 'string' ? Number(String(v).replace(/\./g, '')) : v;
      return Number.isFinite(n) ? n : 0;
    })
    .pipe(z.number().int().min(0)),
  start_date: optionalDate,
  target_end_date: optionalDate,
  milestones: z.array(MilestoneInputSchema).default([]),
  lecturers: z.array(LecturerAssignmentSchema).default([]),
});
export type ProjectCreateInput = z.input<typeof ProjectCreateSchema>;

export const ProjectUpdateSchema = ProjectCreateSchema.partial().extend({
  status: z.enum(PROJECT_STATUSES).optional(),
});
export type ProjectUpdateInput = z.input<typeof ProjectUpdateSchema>;

export const PROJECT_TYPE_LABEL: Record<(typeof PROJECT_TYPES)[number], string> = {
  skripsi: 'Skripsi',
  tesis: 'Tesis',
  disertasi: 'Disertasi',
  'tugas-akhir': 'Tugas Akhir',
  jurnal: 'Jurnal',
  revisi: 'Revisi',
};

export const PROJECT_STATUS_LABEL: Record<(typeof PROJECT_STATUSES)[number], string> = {
  draft: 'Draft',
  active: 'Aktif',
  'on-hold': 'Tertunda',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const MILESTONE_STATUS_LABEL: Record<(typeof MILESTONE_STATUSES)[number], string> = {
  'not-started': 'Belum mulai',
  'in-progress': 'Dikerjakan',
  submitted: 'Diserahkan',
  revisi: 'Revisi',
  approved: 'Disetujui',
  done: 'Selesai',
};

export const LECTURER_ROLE_LABEL: Record<LecturerRole, string> = {
  'pembimbing-1': 'Pembimbing 1',
  'pembimbing-2': 'Pembimbing 2',
  'penguji-1': 'Penguji 1',
  'penguji-2': 'Penguji 2',
  'penguji-3': 'Penguji 3',
};

export const DEFAULT_MILESTONES: MilestoneInput[] = [
  { title: 'Bab 1 — Pendahuluan', sequence: 1, weight_percent: 10 },
  { title: 'Bab 2 — Tinjauan Pustaka', sequence: 2, weight_percent: 20 },
  { title: 'Bab 3 — Metodologi', sequence: 3, weight_percent: 25 },
  { title: 'Bab 4 — Pembahasan', sequence: 4, weight_percent: 25 },
  { title: 'Bab 5 — Penutup', sequence: 5, weight_percent: 15 },
  { title: 'Sidang', sequence: 6, weight_percent: 5 },
];
