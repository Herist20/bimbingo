import { describe, it, expect } from 'vitest';
import { ClientCreateSchema } from '@/lib/schemas/client';
import { PaymentCreateSchema } from '@/lib/schemas/payment';
import { TaskCreateSchema, TaskCommentSchema } from '@/lib/schemas/task';
import { LecturerCreateSchema } from '@/lib/schemas/lecturer';

describe('ClientCreateSchema', () => {
  const valid = {
    full_name: 'Siti Nurhaliza',
    whatsapp: '081234567890',
  };

  it('lulus dgn minimum required (nama + WA)', () => {
    const result = ClientCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('tolak nama < 2 karakter', () => {
    const result = ClientCreateSchema.safeParse({ ...valid, full_name: 'A' });
    expect(result.success).toBe(false);
  });

  it('tolak WhatsApp tidak valid', () => {
    const cases = ['12345', '+1-555-0100', 'wa-num', '00812'];
    for (const wa of cases) {
      const result = ClientCreateSchema.safeParse({ ...valid, whatsapp: wa });
      expect(result.success, `expect fail: ${wa}`).toBe(false);
    }
  });

  it('terima format WhatsApp 08xxx / +62xxx / 62xxx', () => {
    const cases = ['081234567890', '+6281234567890', '6281234567890'];
    for (const wa of cases) {
      const result = ClientCreateSchema.safeParse({ ...valid, whatsapp: wa });
      expect(result.success, `expect pass: ${wa}`).toBe(true);
    }
  });

  it('tolak email tidak valid kalau diisi', () => {
    const result = ClientCreateSchema.safeParse({ ...valid, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('terima email kosong sebagai undefined', () => {
    const result = ClientCreateSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeUndefined();
  });

  it('semester string ke number transform', () => {
    const result = ClientCreateSchema.safeParse({ ...valid, semester: '8' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.semester).toBe(8);
  });

  it('tolak semester di luar 1-20', () => {
    expect(ClientCreateSchema.safeParse({ ...valid, semester: 0 }).success).toBe(false);
    expect(ClientCreateSchema.safeParse({ ...valid, semester: 25 }).success).toBe(false);
  });

  it('target_defense harus YYYY-MM-DD', () => {
    expect(ClientCreateSchema.safeParse({ ...valid, target_defense: '2026-12-15' }).success).toBe(true);
    expect(ClientCreateSchema.safeParse({ ...valid, target_defense: '15/12/2026' }).success).toBe(false);
    expect(ClientCreateSchema.safeParse({ ...valid, target_defense: '' }).success).toBe(true);
  });
});

describe('PaymentCreateSchema', () => {
  const valid = {
    project_id: '00000000-0000-0000-0000-000000000001',
    amount: 1_500_000,
    paid_at: '2026-05-20',
    method: 'transfer-bank' as const,
  };

  it('lulus dgn minimum (project_id + amount + paid_at + method)', () => {
    const result = PaymentCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('amount string dgn pemisah dot ke number', () => {
    const result = PaymentCreateSchema.safeParse({ ...valid, amount: '1.500.000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(1_500_000);
  });

  it('tolak amount ≤ 0', () => {
    expect(PaymentCreateSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(PaymentCreateSchema.safeParse({ ...valid, amount: -500 }).success).toBe(false);
  });

  it('tolak paid_at bukan YYYY-MM-DD', () => {
    expect(PaymentCreateSchema.safeParse({ ...valid, paid_at: '20-05-2026' }).success).toBe(false);
    expect(PaymentCreateSchema.safeParse({ ...valid, paid_at: '' }).success).toBe(false);
  });

  it('tolak method di luar enum', () => {
    expect(
      PaymentCreateSchema.safeParse({ ...valid, method: 'bitcoin' as unknown as 'tunai' }).success,
    ).toBe(false);
  });

  it('terima semua method enum yang valid', () => {
    const methods = ['transfer-bank', 'qris', 'e-wallet', 'tunai', 'lainnya'] as const;
    for (const m of methods) {
      const result = PaymentCreateSchema.safeParse({ ...valid, method: m });
      expect(result.success, `expect pass: ${m}`).toBe(true);
    }
  });

  it('verified default false', () => {
    const result = PaymentCreateSchema.safeParse(valid);
    if (result.success) expect(result.data.verified).toBe(false);
  });
});

describe('TaskCreateSchema', () => {
  const valid = {
    project_id: '00000000-0000-0000-0000-000000000001',
    title: 'Bab 2 — Tinjauan Pustaka',
  };

  it('lulus dgn project_id + title', () => {
    const result = TaskCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('default status backlog + priority medium', () => {
    const result = TaskCreateSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.status).toBe('backlog');
      expect(result.data.priority).toBe('medium');
    }
  });

  it('tolak title kosong', () => {
    expect(TaskCreateSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
    expect(TaskCreateSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
  });

  it('tolak status / priority di luar enum', () => {
    expect(TaskCreateSchema.safeParse({ ...valid, status: 'unknown' }).success).toBe(false);
    expect(TaskCreateSchema.safeParse({ ...valid, priority: 'super' }).success).toBe(false);
  });

  it('due_date wajib YYYY-MM-DD bila diisi', () => {
    expect(TaskCreateSchema.safeParse({ ...valid, due_date: '2026-12-15' }).success).toBe(true);
    expect(TaskCreateSchema.safeParse({ ...valid, due_date: '' }).success).toBe(true);
    expect(TaskCreateSchema.safeParse({ ...valid, due_date: '15-12-2026' }).success).toBe(false);
  });
});

describe('TaskCommentSchema', () => {
  it('tolak body kosong', () => {
    expect(
      TaskCommentSchema.safeParse({
        task_id: '00000000-0000-0000-0000-000000000001',
        body: '',
      }).success,
    ).toBe(false);
  });

  it('terima body normal', () => {
    expect(
      TaskCommentSchema.safeParse({
        task_id: '00000000-0000-0000-0000-000000000001',
        body: 'Revisi paragraf 1.2',
      }).success,
    ).toBe(true);
  });
});

describe('LecturerCreateSchema', () => {
  it('lulus dgn full_name min', () => {
    const result = LecturerCreateSchema.safeParse({ full_name: 'Prof. Budi' });
    expect(result.success).toBe(true);
  });

  it('tolak full_name < 2 karakter', () => {
    expect(LecturerCreateSchema.safeParse({ full_name: 'A' }).success).toBe(false);
  });

  it('email validasi bila diisi', () => {
    expect(
      LecturerCreateSchema.safeParse({ full_name: 'Dr. Sita', email: 'invalid' }).success,
    ).toBe(false);
  });

  it('tags optional default array kosong', () => {
    const result = LecturerCreateSchema.safeParse({ full_name: 'Dr. Sita' });
    if (result.success) {
      expect(Array.isArray(result.data.tags)).toBe(true);
    }
  });
});
