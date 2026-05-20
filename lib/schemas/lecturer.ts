import { z } from 'zod';

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

export const LecturerCreateSchema = z.object({
  full_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  title: optionalString(50),
  university: optionalString(150),
  faculty: optionalString(150),
  email: optionalEmail,
  whatsapp: optionalString(20),
  characteristics: optionalString(2000),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});
export type LecturerCreateInput = z.input<typeof LecturerCreateSchema>;
export type LecturerCreateData = z.output<typeof LecturerCreateSchema>;

export const LecturerUpdateSchema = LecturerCreateSchema.partial();

export const LECTURER_FORM_DEFAULTS: LecturerCreateInput = {
  full_name: '',
  title: '',
  university: '',
  faculty: '',
  email: '',
  whatsapp: '',
  characteristics: '',
  tags: [],
};
