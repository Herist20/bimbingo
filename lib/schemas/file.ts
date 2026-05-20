import { z } from 'zod';

export const FILE_CATEGORIES = [
  'draft',
  'referensi',
  'bukti-bayar',
  'administrasi',
  'final',
  'lainnya',
] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const FILE_CATEGORY_LABEL: Record<FileCategory, string> = {
  draft: 'Draft Bab',
  referensi: 'Referensi',
  'bukti-bayar': 'Bukti Bayar',
  administrasi: 'Administrasi',
  final: 'Final',
  lainnya: 'Lainnya',
};

export const FILE_CATEGORY_TONE: Record<FileCategory, 'neutral' | 'brand' | 'success' | 'warning'> = {
  draft: 'brand',
  referensi: 'neutral',
  'bukti-bayar': 'warning',
  administrasi: 'neutral',
  final: 'success',
  lainnya: 'neutral',
};

export const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
]);

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const SignedUploadRequestSchema = z.object({
  project_id: z.string().uuid(),
  task_id: z.string().uuid().optional().nullable(),
  filename: z.string().trim().min(1).max(255),
  content_type: z.string().trim().min(1).max(150),
  size_bytes: z.number().int().min(1).max(MAX_FILE_BYTES),
  category: z.enum(FILE_CATEGORIES).default('lainnya'),
});

export const RecordFileSchema = z.object({
  project_id: z.string().uuid(),
  task_id: z.string().uuid().optional().nullable(),
  path: z.string().trim().min(1),
  filename: z.string().trim().min(1).max(255),
  mime_type: z.string().trim().min(1).max(150),
  size_bytes: z.number().int().min(1).max(MAX_FILE_BYTES),
  category: z.enum(FILE_CATEGORIES).default('lainnya'),
});
