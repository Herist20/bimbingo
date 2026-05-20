'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CheckCircle2, CircleSlash, MoreHorizontal, PencilLine, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PaymentMethodBadge } from './payment-method-badge';
import { PaymentForm } from './payment-form';
import {
  deletePayment,
  setPaymentVerified,
  type PaymentRow,
} from '@/lib/actions/payments';
import { formatRupiah, formatTanggal } from '@/lib/format';

interface PaymentsTableProps {
  projectId: string;
  initial: PaymentRow[];
}

export function PaymentsTable({ projectId, initial }: PaymentsTableProps) {
  const [rows, setRows] = React.useState<PaymentRow[]>(initial);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PaymentRow | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  React.useEffect(() => setRows(initial), [initial]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: PaymentRow) {
    setEditing(row);
    setFormOpen(true);
  }

  function handleSaved(row: PaymentRow) {
    setRows((prev) => {
      const exists = prev.some((p) => p.id === row.id);
      const next = exists
        ? prev.map((p) => (p.id === row.id ? row : p))
        : [row, ...prev];
      return next.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
    });
    setFormOpen(false);
  }

  function handleDelete(row: PaymentRow) {
    if (confirmId !== row.id) {
      setConfirmId(row.id);
      toast.warning('Klik sekali lagi untuk konfirmasi hapus.');
      window.setTimeout(() => setConfirmId(null), 4000);
      return;
    }
    startTransition(async () => {
      const result = await deletePayment(row.id);
      setConfirmId(null);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setRows((prev) => prev.filter((p) => p.id !== row.id));
      toast.success('Pembayaran dihapus.');
    });
  }

  function handleVerifyToggle(row: PaymentRow) {
    startTransition(async () => {
      const result = await setPaymentVerified(row.id, !row.verified);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setRows((prev) => prev.map((p) => (p.id === row.id ? result.data : p)));
      toast.success(result.data.verified ? 'Ditandai verified.' : 'Status unverify.');
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {rows.length} transaksi
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Catat pembayaran
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium text-right">Nominal</th>
              <th className="px-4 py-2 font-medium">Metode</th>
              <th className="px-4 py-2 font-medium">Label</th>
              <th className="px-4 py-2 font-medium">Verified</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                  Belum ada transaksi. Klik &quot;Catat pembayaran&quot;.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-3 text-sm">{formatTanggal(row.paid_at)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatRupiah(row.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={row.method} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {row.installment_label ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.verified ? (
                      <Badge tone="success">
                        <CheckCircle2 className="mr-1 inline h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge tone="warning">Pending</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Menu transaksi ${formatTanggal(row.paid_at)}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={pending}
                          onSelect={() => handleVerifyToggle(row)}
                        >
                          {row.verified ? (
                            <>
                              <CircleSlash className="h-4 w-4" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Tandai verified
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(row)}>
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={pending}
                          onSelect={() => handleDelete(row)}
                          className={confirmId === row.id ? 'text-[var(--danger)]' : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                          {confirmId === row.id ? 'Klik lagi untuk konfirmasi' : 'Hapus'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DialogPrimitive.Root open={formOpen} onOpenChange={setFormOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-6 shadow-xl"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="text-lg font-semibold">
              {editing ? 'Edit pembayaran' : 'Catat pembayaran'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)]">
              Pencatatan manual. Pembayaran masuk akan dihitung otomatis ke sisa piutang.
            </DialogPrimitive.Description>
            <div className="mt-4">
              <PaymentForm
                mode={editing ? 'edit' : 'create'}
                projectId={projectId}
                paymentId={editing?.id}
                initial={editing ?? undefined}
                onDone={handleSaved}
                onCancel={() => setFormOpen(false)}
              />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
