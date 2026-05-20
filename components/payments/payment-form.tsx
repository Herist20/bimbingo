'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  PaymentCreateSchema,
  type PaymentMethod,
} from '@/lib/schemas/payment';
import { recordPayment, updatePayment, type PaymentRow } from '@/lib/actions/payments';

interface PaymentFormProps {
  mode: 'create' | 'edit';
  projectId: string;
  paymentId?: string;
  initial?: Partial<PaymentRow>;
  onDone?: (row: PaymentRow) => void;
  onCancel?: () => void;
}

const INSTALLMENT_PRESETS = ['DP', 'Termin 1', 'Termin 2', 'Termin 3', 'Pelunasan'];

export function PaymentForm({
  mode,
  projectId,
  paymentId,
  initial,
  onDone,
  onCancel,
}: PaymentFormProps) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(initial?.amount ?? ''));
  const [paidAt, setPaidAt] = React.useState(
    initial?.paid_at ?? new Date().toISOString().slice(0, 10),
  );
  const [method, setMethod] = React.useState<PaymentMethod>(
    (initial?.method as PaymentMethod) ?? 'transfer-bank',
  );
  const [reference, setReference] = React.useState(initial?.reference ?? '');
  const [installmentLabel, setInstallmentLabel] = React.useState(
    initial?.installment_label ?? '',
  );
  const [notes, setNotes] = React.useState(initial?.notes ?? '');
  const [verified, setVerified] = React.useState(initial?.verified ?? false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      project_id: projectId,
      amount,
      paid_at: paidAt,
      method,
      reference,
      installment_label: installmentLabel,
      notes,
      verified,
    };
    const parsed = PaymentCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const e: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) if (v?.[0]) e[k] = v[0];
      setErrors(e);
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await recordPayment(payload)
          : await updatePayment(paymentId!, payload);
      if (!result.ok) {
        if (result.error.fields) {
          const e: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.error.fields)) {
            if (v?.[0]) e[k] = v[0];
          }
          setErrors(e);
        }
        toast.error(result.error.message);
        return;
      }
      toast.success(mode === 'create' ? 'Pembayaran tercatat.' : 'Pembayaran diperbarui.');
      if (onDone) onDone(result.data);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nominal (Rp)" htmlFor="pay-amount" required error={errors.amount}>
          <Input
            id="pay-amount"
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1500000"
          />
        </Field>
        <Field label="Tanggal" htmlFor="pay-date" required error={errors.paid_at}>
          <Input
            id="pay-date"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </Field>
        <Field label="Metode" htmlFor="pay-method" required error={errors.method}>
          <select
            id="pay-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="h-10 rounded-md border bg-[var(--bg-base)] px-3 text-sm"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Label termin"
          htmlFor="pay-label"
          hint="Mis. DP / Termin 1 / Pelunasan"
          error={errors.installment_label}
        >
          <Input
            id="pay-label"
            list="installment-presets"
            value={installmentLabel}
            onChange={(e) => setInstallmentLabel(e.target.value)}
          />
          <datalist id="installment-presets">
            {INSTALLMENT_PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="No. referensi" htmlFor="pay-ref" hint="No. transaksi / ID" error={errors.reference}>
          <Input
            id="pay-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
        <Field label="Verified">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Sudah ter-verifikasi (bukti cocok dengan rekening)
          </label>
        </Field>
      </div>

      <Field label="Catatan" htmlFor="pay-notes" error={errors.notes}>
        <textarea
          id="pay-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex w-full rounded-md border bg-[var(--bg-base)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ring-offset-[var(--bg-base)] border-[var(--border-strong)]"
        />
      </Field>

      <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Batal
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : mode === 'create' ? 'Catat pembayaran' : 'Perbarui'}
        </Button>
      </div>
    </form>
  );
}
