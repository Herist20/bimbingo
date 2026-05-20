import { z } from 'zod';

export const SignInWithPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(72),
});
export type SignInWithPasswordInput = z.infer<typeof SignInWithPasswordSchema>;

export const SendMagicLinkSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});
export type SendMagicLinkInput = z.infer<typeof SendMagicLinkSchema>;
