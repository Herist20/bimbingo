import { describe, it, expect } from 'vitest';
import { formatRupiah, formatTanggal, formatTanggalRelatif } from '@/lib/format';

describe('formatRupiah', () => {
  it('formats whole number tanpa desimal', () => {
    expect(formatRupiah(1_500_000)).toMatch(/Rp\s?1\.500\.000/);
  });

  it('returns Rp 0 untuk null / undefined / NaN', () => {
    expect(formatRupiah(null)).toBe('Rp 0');
    expect(formatRupiah(undefined)).toBe('Rp 0');
    expect(formatRupiah(NaN)).toBe('Rp 0');
  });

  it('handles nilai 0', () => {
    expect(formatRupiah(0)).toMatch(/Rp\s?0/);
  });

  it('handles nilai negatif (refund)', () => {
    const result = formatRupiah(-500_000);
    expect(result).toMatch(/-?Rp\s?500\.000|Rp\s?-?500\.000/);
  });

  it('drop desimal sub-rupiah', () => {
    expect(formatRupiah(1234.56)).toMatch(/Rp\s?1\.235|Rp\s?1\.234/);
  });
});

describe('formatTanggal', () => {
  it('format default dd MMM yyyy bahasa Indonesia', () => {
    const result = formatTanggal('2026-05-20');
    expect(result).toMatch(/20 Mei 2026/);
  });

  it('terima Date object', () => {
    const result = formatTanggal(new Date('2026-12-25'));
    expect(result).toMatch(/25 Des 2026/);
  });

  it('em-dash untuk null / undefined / invalid', () => {
    expect(formatTanggal(null)).toBe('—');
    expect(formatTanggal(undefined)).toBe('—');
    expect(formatTanggal('')).toBe('—');
    expect(formatTanggal('not-a-date')).toBe('—');
  });

  it('honor custom pattern', () => {
    const result = formatTanggal('2026-05-20T10:30:00Z', 'dd-MM-yyyy');
    expect(result).toBe('20-05-2026');
  });
});

describe('formatTanggalRelatif', () => {
  function isoDaysFromNow(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  it('Hari ini', () => {
    expect(formatTanggalRelatif(new Date())).toBe('Hari ini');
  });

  it('Besok dan Kemarin', () => {
    expect(formatTanggalRelatif(isoDaysFromNow(1))).toBe('Besok');
    expect(formatTanggalRelatif(isoDaysFromNow(-1))).toBe('Kemarin');
  });

  it('N hari lagi (future)', () => {
    expect(formatTanggalRelatif(isoDaysFromNow(5))).toBe('5 hari lagi');
  });

  it('N hari lalu (past)', () => {
    expect(formatTanggalRelatif(isoDaysFromNow(-7))).toBe('7 hari lalu');
  });

  it('em-dash untuk null / undefined', () => {
    expect(formatTanggalRelatif(null)).toBe('—');
    expect(formatTanggalRelatif(undefined)).toBe('—');
  });
});
