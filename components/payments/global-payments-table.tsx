'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaymentMethodBadge } from './payment-method-badge';
import { formatRupiah, formatTanggal } from '@/lib/format';
import type { PaymentListRow } from '@/lib/actions/payments';

export function GlobalPaymentsTable({ data }: { data: PaymentListRow[] }) {
  const [query, setQuery] = React.useState('');
  const visible = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return data;
    return data.filter((p) =>
      [p.project_title, p.client_name, p.installment_label, p.reference, p.method]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q)),
    );
  }, [data, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari klien / proyek / label…"
            className="pl-8"
          />
        </div>
        <span className="text-xs text-[var(--text-muted)]">{visible.length} transaksi</span>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Klien</th>
              <th className="px-4 py-2 font-medium">Proyek</th>
              <th className="px-4 py-2 font-medium">Label</th>
              <th className="px-4 py-2 font-medium">Metode</th>
              <th className="px-4 py-2 font-medium text-right">Nominal</th>
              <th className="px-4 py-2 font-medium">Verified</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                  Belum ada transaksi yang cocok.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.id}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-3 text-sm">{formatTanggal(row.paid_at)}</td>
                  <td className="px-4 py-3 text-sm">{row.client_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/projects/${row.project_id}/finance`}
                      className="hover:underline"
                    >
                      {row.project_title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{row.installment_label ?? '—'}</td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={row.method} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatRupiah(row.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {row.verified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge tone="warning">Pending</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
