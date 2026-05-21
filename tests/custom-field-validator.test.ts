import { describe, it, expect } from 'vitest';
import {
  buildCustomDataValidator,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';

function fieldOf(partial: Partial<CustomFieldRow>): CustomFieldRow {
  return {
    id: 'f1',
    owner_id: 'owner',
    entity_type: 'client',
    scope: 'global',
    scope_ref: null,
    key: 'sample',
    label: 'Sample',
    description: null,
    field_type: 'text',
    options: [],
    required: false,
    default_value: null,
    sequence: 1,
    show_in_form: true,
    show_in_list: true,
    show_in_card: false,
    archived_at: null,
    created_at: '2026-05-20T00:00:00Z',
    updated_at: '2026-05-20T00:00:00Z',
    ...partial,
  };
}

describe('buildCustomDataValidator — basic types', () => {
  it('text — string OK, number reject', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'kota', field_type: 'text' })]);
    expect(v.safeParse({ kota: 'Jakarta' }).success).toBe(true);
    expect(v.safeParse({ kota: 123 }).success).toBe(false);
  });

  it('long_text — max 10000', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'note', field_type: 'long_text' })]);
    expect(v.safeParse({ note: 'a'.repeat(5_000) }).success).toBe(true);
    expect(v.safeParse({ note: 'a'.repeat(10_001) }).success).toBe(false);
  });

  it('number — accept finite, reject string + NaN', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'usia', field_type: 'number' })]);
    expect(v.safeParse({ usia: 22 }).success).toBe(true);
    expect(v.safeParse({ usia: '22' }).success).toBe(false);
    expect(v.safeParse({ usia: NaN }).success).toBe(false);
  });

  it('currency — integer nonneg', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'fee', field_type: 'currency' })]);
    expect(v.safeParse({ fee: 1_500_000 }).success).toBe(true);
    expect(v.safeParse({ fee: -100 }).success).toBe(false);
    expect(v.safeParse({ fee: 1500.5 }).success).toBe(false);
  });

  it('percent — 0-100', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'prog', field_type: 'percent' })]);
    expect(v.safeParse({ prog: 0 }).success).toBe(true);
    expect(v.safeParse({ prog: 100 }).success).toBe(true);
    expect(v.safeParse({ prog: 101 }).success).toBe(false);
    expect(v.safeParse({ prog: -1 }).success).toBe(false);
  });

  it('date — YYYY-MM-DD', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'mulai', field_type: 'date' })]);
    expect(v.safeParse({ mulai: '2026-05-20' }).success).toBe(true);
    expect(v.safeParse({ mulai: '20/05/2026' }).success).toBe(false);
  });

  it('datetime — ISO 8601', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'ts', field_type: 'datetime' })]);
    expect(v.safeParse({ ts: '2026-05-20T10:30:00Z' }).success).toBe(true);
    expect(v.safeParse({ ts: '2026-05-20 10:30' }).success).toBe(false);
  });

  it('boolean strict', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'aktif', field_type: 'boolean' })]);
    expect(v.safeParse({ aktif: true }).success).toBe(true);
    expect(v.safeParse({ aktif: false }).success).toBe(true);
    expect(v.safeParse({ aktif: 'true' }).success).toBe(false);
    expect(v.safeParse({ aktif: 1 }).success).toBe(false);
  });

  it('url + email + phone', () => {
    const url = buildCustomDataValidator([fieldOf({ key: 'web', field_type: 'url' })]);
    expect(url.safeParse({ web: 'https://example.com' }).success).toBe(true);
    expect(url.safeParse({ web: 'invalid' }).success).toBe(false);

    const email = buildCustomDataValidator([fieldOf({ key: 'e', field_type: 'email' })]);
    expect(email.safeParse({ e: 'a@b.id' }).success).toBe(true);
    expect(email.safeParse({ e: 'not-email' }).success).toBe(false);

    const phone = buildCustomDataValidator([fieldOf({ key: 'p', field_type: 'phone' })]);
    expect(phone.safeParse({ p: '081234567890' }).success).toBe(true);
    expect(phone.safeParse({ p: 'abc' }).success).toBe(false);
  });

  it('user_ref — UUID', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'who', field_type: 'user_ref' })]);
    expect(v.safeParse({ who: '00000000-0000-0000-0000-000000000001' }).success).toBe(true);
    expect(v.safeParse({ who: 'not-uuid' }).success).toBe(false);
  });
});

describe('buildCustomDataValidator — select / multiselect', () => {
  const selectField = fieldOf({
    key: 'tipe',
    field_type: 'select',
    options: [
      { value: 'kualitatif', label: 'Kualitatif' },
      { value: 'kuantitatif', label: 'Kuantitatif' },
    ],
  });

  it('select — value harus dari options', () => {
    const v = buildCustomDataValidator([selectField]);
    expect(v.safeParse({ tipe: 'kualitatif' }).success).toBe(true);
    expect(v.safeParse({ tipe: 'mixed' }).success).toBe(false);
  });

  it('multiselect — array dari options', () => {
    const v = buildCustomDataValidator([
      { ...selectField, field_type: 'multiselect', key: 'tags' },
    ]);
    expect(v.safeParse({ tags: ['kualitatif'] }).success).toBe(true);
    expect(v.safeParse({ tags: ['kualitatif', 'kuantitatif'] }).success).toBe(true);
    expect(v.safeParse({ tags: ['unknown'] }).success).toBe(false);
    expect(v.safeParse({ tags: 'kualitatif' }).success).toBe(false);
  });
});

describe('buildCustomDataValidator — required toggle', () => {
  it('required true — value wajib', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'wajib', field_type: 'text', required: true })]);
    expect(v.safeParse({}).success).toBe(false);
    expect(v.safeParse({ wajib: 'isi' }).success).toBe(true);
  });

  it('required false — boleh kosong / null / undefined', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'opsi', field_type: 'text', required: false })]);
    expect(v.safeParse({}).success).toBe(true);
    expect(v.safeParse({ opsi: null }).success).toBe(true);
    expect(v.safeParse({ opsi: undefined }).success).toBe(true);
    expect(v.safeParse({ opsi: 'ada' }).success).toBe(true);
  });
});

describe('buildCustomDataValidator — passthrough', () => {
  it('keep unknown keys (data lama tidak hilang saat field diarsipkan)', () => {
    const v = buildCustomDataValidator([fieldOf({ key: 'kota' })]);
    const result = v.safeParse({ kota: 'Jakarta', legacy_field: 'still-here' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).legacy_field).toBe('still-here');
    }
  });
});

describe('buildCustomDataValidator — multi-field combo', () => {
  it('semua field valid → lulus', () => {
    const v = buildCustomDataValidator([
      fieldOf({ key: 'kota', field_type: 'text' }),
      fieldOf({ key: 'tarif', field_type: 'currency' }),
      fieldOf({ key: 'aktif', field_type: 'boolean' }),
    ]);
    const result = v.safeParse({ kota: 'Bandung', tarif: 2_500_000, aktif: true });
    expect(result.success).toBe(true);
  });

  it('satu field invalid → reject di field tersebut', () => {
    const v = buildCustomDataValidator([
      fieldOf({ key: 'kota', field_type: 'text' }),
      fieldOf({ key: 'tarif', field_type: 'currency' }),
    ]);
    const result = v.safeParse({ kota: 'Bandung', tarif: -1 });
    expect(result.success).toBe(false);
  });
});
