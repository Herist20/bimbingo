import { describe, expect, it } from 'vitest';
import {
  InviteClientSchema,
  RequestPortalOtpSchema,
  VerifyPortalOtpSchema,
} from '@/lib/schemas/portal';

describe('InviteClientSchema', () => {
  it('accepts valid uuid', () => {
    const r = InviteClientSchema.safeParse({ clientId: 'a3bb189e-8bf9-3888-9912-ace4e6543002' });
    expect(r.success).toBe(true);
  });
  it('rejects non-uuid', () => {
    const r = InviteClientSchema.safeParse({ clientId: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });
});

describe('RequestPortalOtpSchema', () => {
  it('accepts valid email', () => {
    const r = RequestPortalOtpSchema.safeParse({ email: 'klien@example.com' });
    expect(r.success).toBe(true);
  });
  it('rejects invalid email', () => {
    const r = RequestPortalOtpSchema.safeParse({ email: 'bukan-email' });
    expect(r.success).toBe(false);
  });
});

describe('VerifyPortalOtpSchema', () => {
  it('accepts 6-digit numeric token', () => {
    const r = VerifyPortalOtpSchema.safeParse({
      email: 'klien@example.com',
      token: '123456',
    });
    expect(r.success).toBe(true);
  });
  it('rejects non-numeric token', () => {
    const r = VerifyPortalOtpSchema.safeParse({
      email: 'klien@example.com',
      token: '12abcd',
    });
    expect(r.success).toBe(false);
  });
  it('rejects wrong length token', () => {
    const r = VerifyPortalOtpSchema.safeParse({
      email: 'klien@example.com',
      token: '12345',
    });
    expect(r.success).toBe(false);
  });
});
