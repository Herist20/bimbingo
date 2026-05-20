import { z } from 'zod';

export const PAYMENT_METHODS = [
  'transfer-bank',
  'qris',
  'e-wallet',
  'tunai',
  'lainnya',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  'transfer-bank': 'Transfer Bank',
  qris: 'QRIS',
  'e-wallet': 'E-Wallet',
  tunai: 'Tunai',
  lainnya: 'Lainnya',
};

export const PAYMENT_METHOD_TONE: Record<PaymentMethod, 'neutral' | 'brand' | 'warning' | 'success'> = {
  'transfer-bank': 'brand',
  qris: 'success',
  'e-wallet': 'warning',
  tunai: 'neutral',
  lainnya: 'neutral',
};

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v));

const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const PaymentCreateSchema = z.object({
  project_id: z.string().uuid(),
  amount: z
    .union([z.number(), z.string()])
    .transform((v) => {
      if (typeof v === 'number') return v;
      return Number(String(v).replace(/\./g, '').replace(/,/g, ''));
    })
    .pipe(z.number().int().positive('Nominal harus lebih dari 0')),
  paid_at: requiredDate,
  method: z.enum(PAYMENT_METHODS),
  reference: optionalString(150),
  installment_label: optionalString(60),
  proof_file_id: z.string().uuid().optional().nullable(),
  notes: optionalString(2000),
  verified: z.boolean().default(false),
});
export type PaymentCreateInput = z.input<typeof PaymentCreateSchema>;

export const PaymentUpdateSchema = PaymentCreateSchema.partial().omit({ project_id: true });
export type PaymentUpdateInput = z.input<typeof PaymentUpdateSchema>;
