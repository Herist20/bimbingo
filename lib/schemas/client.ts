import { z } from 'zod';

const whatsappRegex = /^(\+62|62|0)8\d{8,12}$/;

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v));

const optionalEmail = z
  .string()
  .trim()
  .email('Format email tidak valid')
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

export const ClientCreateSchema = z.object({
  full_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  nickname: optionalString(50),
  whatsapp: z
    .string()
    .trim()
    .regex(whatsappRegex, 'Format WhatsApp tidak valid (cth: 08xxx atau +62xxx)'),
  email: optionalEmail,
  university: optionalString(150),
  faculty: optionalString(150),
  major: optionalString(150),
  student_id: optionalString(50),
  semester: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === '' || v === null) return undefined;
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? n : undefined;
    })
    .pipe(
      z
        .number()
        .int('Semester harus bilangan bulat')
        .min(1)
        .max(20)
        .optional(),
    ),
  target_defense: optionalDate,
  source: optionalString(100),
  notes: optionalString(2000),
});
export type ClientCreateInput = z.input<typeof ClientCreateSchema>;
export type ClientCreateData = z.output<typeof ClientCreateSchema>;

export const ClientUpdateSchema = ClientCreateSchema.partial();
export type ClientUpdateInput = z.input<typeof ClientUpdateSchema>;
export type ClientUpdateData = z.output<typeof ClientUpdateSchema>;

export const CLIENT_FORM_DEFAULTS: ClientCreateInput = {
  full_name: '',
  nickname: '',
  whatsapp: '',
  email: '',
  university: '',
  faculty: '',
  major: '',
  student_id: '',
  semester: undefined,
  target_defense: '',
  source: '',
  notes: '',
};
