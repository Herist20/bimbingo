import { z } from 'zod';

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v));

export const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: optionalString(20),
  timezone: optionalString(50),
  avatar_url: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
});
export type ProfileUpdateInput = z.input<typeof ProfileUpdateSchema>;

export const PasswordUpdateSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Minimal 8 karakter')
      .max(72, 'Maksimal 72 karakter'),
    confirm_password: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirm_password'],
        message: 'Konfirmasi tidak cocok dengan password baru.',
      });
    }
  });
export type PasswordUpdateInput = z.input<typeof PasswordUpdateSchema>;
