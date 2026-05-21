/**
 * Generate CSV (RFC 4180) dari array of records.
 * - Field yang mengandung `,` `"` newline akan di-quote + escape `"` ke `""`.
 * - Prepend UTF-8 BOM supaya Excel auto-detect encoding.
 * - Null/undefined → string kosong.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; label: string }>,
): string {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = row[c.key];
          if (v === null || v === undefined) return '';
          if (typeof v === 'object') return escapeCell(JSON.stringify(v));
          return escapeCell(String(v));
        })
        .join(','),
    )
    .join('\r\n');

  const BOM = '﻿';
  return `${BOM}${header}\r\n${body}\r\n`;
}

function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvFilename(entity: string, ext = 'csv') {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return `bimbingo-${entity}-${date}.${ext}`;
}
