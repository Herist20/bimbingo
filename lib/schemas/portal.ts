import { z } from 'zod';

export const InviteClientSchema = z.object({
  clientId: z.string().uuid('Client ID tidak valid'),
});
export type InviteClientInput = z.infer<typeof InviteClientSchema>;

export const RequestPortalOtpSchema = z.object({
  email: z.string().email('Email tidak valid'),
});
export type RequestPortalOtpInput = z.infer<typeof RequestPortalOtpSchema>;

export const VerifyPortalOtpSchema = z.object({
  email: z.string().email('Email tidak valid'),
  token: z
    .string()
    .length(6, 'OTP harus 6 digit')
    .regex(/^\d+$/, 'OTP harus 6 digit angka'),
});
export type VerifyPortalOtpInput = z.infer<typeof VerifyPortalOtpSchema>;

export const RevokeClientPortalSchema = InviteClientSchema;
export type RevokeClientPortalInput = z.infer<typeof RevokeClientPortalSchema>;
