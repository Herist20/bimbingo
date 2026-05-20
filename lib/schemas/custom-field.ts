import { z } from 'zod';

export const CF_ENTITY_TYPES = ['client', 'project', 'task', 'payment', 'lecturer'] as const;
export type CFEntityType = (typeof CF_ENTITY_TYPES)[number];

export const CF_ENTITY_LABEL: Record<CFEntityType, string> = {
  client: 'Klien',
  project: 'Proyek',
  task: 'Task',
  payment: 'Pembayaran',
  lecturer: 'Dosen',
};

export const CF_FIELD_TYPES = [
  'text',
  'long_text',
  'number',
  'currency',
  'percent',
  'date',
  'datetime',
  'boolean',
  'select',
  'multiselect',
  'user_ref',
  'url',
  'email',
  'phone',
] as const;
export type CFFieldType = (typeof CF_FIELD_TYPES)[number];

export const CF_FIELD_TYPE_LABEL: Record<CFFieldType, string> = {
  text: 'Teks pendek',
  long_text: 'Teks panjang',
  number: 'Angka',
  currency: 'Mata uang (Rp)',
  percent: 'Persen (0-100)',
  date: 'Tanggal',
  datetime: 'Tanggal + waktu',
  boolean: 'Ya / Tidak',
  select: 'Pilihan tunggal',
  multiselect: 'Pilihan ganda',
  user_ref: 'Referensi user',
  url: 'URL',
  email: 'Email',
  phone: 'Telepon',
};

export const CF_OPTION_TONES = ['neutral', 'brand', 'success', 'warning', 'danger'] as const;
export type CFOptionTone = (typeof CF_OPTION_TONES)[number];

export const CFOptionSchema = z.object({
  value: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  color: z.enum(CF_OPTION_TONES).optional(),
});
export type CFOption = z.infer<typeof CFOptionSchema>;

function slugifyKey(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

export const CustomFieldCreateSchema = z
  .object({
    entity_type: z.enum(CF_ENTITY_TYPES),
    scope: z.enum(['global', 'project']).default('global'),
    scope_ref: z.string().uuid().optional().nullable(),
    key: z
      .string()
      .trim()
      .max(60)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    label: z.string().trim().min(2).max(80),
    description: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    field_type: z.enum(CF_FIELD_TYPES),
    options: z.array(CFOptionSchema).max(50).default([]),
    required: z.boolean().default(false),
    show_in_form: z.boolean().default(true),
    show_in_list: z.boolean().default(true),
    show_in_card: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (
      (data.field_type === 'select' || data.field_type === 'multiselect') &&
      data.options.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tipe pilihan butuh minimal 1 opsi.',
        path: ['options'],
      });
    }
  })
  .transform((data) => ({
    ...data,
    key: data.key && data.key.length > 0 ? slugifyKey(data.key) : slugifyKey(data.label),
  }));

export type CustomFieldCreateInput = z.input<typeof CustomFieldCreateSchema>;

export const CustomFieldUpdateSchema = z
  .object({
    label: z.string().trim().min(2).max(80).optional(),
    description: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    options: z.array(CFOptionSchema).max(50).optional(),
    required: z.boolean().optional(),
    show_in_form: z.boolean().optional(),
    show_in_list: z.boolean().optional(),
    show_in_card: z.boolean().optional(),
    sequence: z.number().int().min(0).max(1000).optional(),
  });
export type CustomFieldUpdateInput = z.input<typeof CustomFieldUpdateSchema>;

export type CustomFieldRow = {
  id: string;
  owner_id: string;
  entity_type: CFEntityType;
  scope: 'global' | 'project';
  scope_ref: string | null;
  key: string;
  label: string;
  description: string | null;
  field_type: CFFieldType;
  options: CFOption[];
  required: boolean;
  default_value: unknown;
  sequence: number;
  show_in_form: boolean;
  show_in_list: boolean;
  show_in_card: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Bangun zod schema dinamis untuk validasi nilai `custom_data` per entitas.
 * Field unknown ditolerir (passthrough) supaya data lama tidak hilang.
 */
export function buildCustomDataValidator(fields: CustomFieldRow[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let v: z.ZodTypeAny;
    switch (f.field_type) {
      case 'text':
        v = z.string().max(500);
        break;
      case 'long_text':
        v = z.string().max(10_000);
        break;
      case 'number':
        v = z.number().finite();
        break;
      case 'currency':
        v = z.number().int().nonnegative();
        break;
      case 'percent':
        v = z.number().min(0).max(100);
        break;
      case 'date':
        v = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD');
        break;
      case 'datetime':
        v = z.string().datetime();
        break;
      case 'boolean':
        v = z.boolean();
        break;
      case 'select': {
        const values = f.options.map((o) => o.value);
        v = values.length
          ? z.enum(values as [string, ...string[]])
          : z.never();
        break;
      }
      case 'multiselect': {
        const values = f.options.map((o) => o.value);
        v = values.length
          ? z.array(z.enum(values as [string, ...string[]]))
          : z.array(z.never());
        break;
      }
      case 'user_ref':
        v = z.string().uuid();
        break;
      case 'url':
        v = z.string().url();
        break;
      case 'email':
        v = z.string().email();
        break;
      case 'phone':
        v = z.string().regex(/^[+\d\s-]{6,20}$/, 'Format telepon tidak valid');
        break;
      default:
        v = z.unknown();
    }
    shape[f.key] = f.required ? v : v.optional().nullable();
  }
  return z.object(shape).passthrough();
}
