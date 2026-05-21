'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  PAYMENT_METHODS,
  PaymentCreateSchema,
  PaymentUpdateSchema,
  type PaymentMethod,
} from '@/lib/schemas/payment';
import {
  buildCustomDataValidator,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';
import type { Json } from '@/types/database';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

async function fetchPaymentCustomFields(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
): Promise<CustomFieldRow[]> {
  const { data, error } = await supabase
    .from('custom_fields')
    .select(
      'id, owner_id, entity_type, scope, scope_ref, key, label, description, field_type, options, required, default_value, sequence, show_in_form, show_in_list, show_in_card, archived_at, created_at, updated_at',
    )
    .eq('entity_type', 'payment')
    .is('archived_at', null);
  if (error) throw error;
  return (data ?? []) as CustomFieldRow[];
}

function toJson(value: Record<string, unknown>): Json {
  return value as unknown as Json;
}

export type PaymentRow = {
  id: string;
  project_id: string;
  amount: number;
  paid_at: string;
  method: string;
  reference: string | null;
  installment_label: string | null;
  proof_file_id: string | null;
  notes: string | null;
  verified: boolean;
  custom_data: Record<string, unknown>;
  created_at: string;
};

export type PaymentListRow = PaymentRow & {
  project_title: string;
  client_name: string;
};

const COLUMNS =
  'id, project_id, amount, paid_at, method, reference, installment_label, proof_file_id, notes, verified, custom_data, created_at';

export async function listPaymentsByProject(
  projectId: string,
): Promise<ActionResult<PaymentRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('payments')
      .select(COLUMNS)
      .eq('project_id', projectId)
      .order('paid_at', { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as PaymentRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function listPaymentsRange(opts: {
  from?: string;
  to?: string;
}): Promise<ActionResult<PaymentListRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    let req = supabase
      .from('payments')
      .select(
        `${COLUMNS}, project:projects!inner(id, title, client:clients!inner(id, full_name))`,
      )
      .order('paid_at', { ascending: false });
    if (opts.from) req = req.gte('paid_at', opts.from);
    if (opts.to) req = req.lte('paid_at', opts.to);
    const { data, error } = await req;
    if (error) throw error;

    const rows: PaymentListRow[] = (data ?? []).map((p) => {
      const project = (p as unknown as { project?: { title?: string; client?: { full_name?: string } } }).project;
      return {
        id: p.id,
        project_id: p.project_id,
        amount: p.amount,
        paid_at: p.paid_at,
        method: p.method,
        reference: p.reference,
        installment_label: p.installment_label,
        proof_file_id: p.proof_file_id,
        notes: p.notes,
        verified: p.verified,
        custom_data: (p.custom_data as Record<string, unknown> | null) ?? {},
        created_at: p.created_at,
        project_title: project?.title ?? '—',
        client_name: project?.client?.full_name ?? '—',
      };
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

export async function recordPayment(input: unknown): Promise<ActionResult<PaymentRow>> {
  try {
    await requireUser();
    const parsed = PaymentCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian pembayaran.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const fields = await fetchPaymentCustomFields(supabase);
    const cdRaw =
      (input as { custom_data?: Record<string, unknown> } | null | undefined)?.custom_data ?? {};
    const cdResult = buildCustomDataValidator(fields).safeParse(cdRaw);
    if (!cdResult.success) {
      throw new ActionError(
        'validation_error',
        'Field tambahan tidak valid.',
        cdResult.error.flatten().fieldErrors as never,
      );
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        project_id: parsed.data.project_id,
        amount: parsed.data.amount,
        paid_at: parsed.data.paid_at,
        method: parsed.data.method,
        reference: parsed.data.reference ?? null,
        installment_label: parsed.data.installment_label ?? null,
        proof_file_id: parsed.data.proof_file_id ?? null,
        notes: parsed.data.notes ?? null,
        verified: parsed.data.verified,
        custom_data: toJson(cdResult.data),
      })
      .select(COLUMNS)
      .single();
    if (error) throw error;

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${parsed.data.project_id}/finance`);
    revalidatePath(`/projects/${parsed.data.project_id}`);
    return ok(data as PaymentRow);
  } catch (e) {
    return fail(e);
  }
}

export async function updatePayment(
  id: string,
  input: unknown,
): Promise<ActionResult<PaymentRow>> {
  try {
    await requireUser();
    const parsed = PaymentUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian pembayaran.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const cdRaw = (input as { custom_data?: Record<string, unknown> } | null | undefined)?.custom_data;
    let custom_data: Json | undefined;
    if (cdRaw !== undefined) {
      const fields = await fetchPaymentCustomFields(supabase);
      const cdResult = buildCustomDataValidator(fields).safeParse(cdRaw);
      if (!cdResult.success) {
        throw new ActionError(
          'validation_error',
          'Field tambahan tidak valid.',
          cdResult.error.flatten().fieldErrors as never,
        );
      }
      custom_data = toJson(cdResult.data);
    }
    const patch = custom_data !== undefined ? { ...parsed.data, custom_data } : parsed.data;

    const { data, error } = await supabase
      .from('payments')
      .update(patch)
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${data.project_id}/finance`);
    revalidatePath(`/projects/${data.project_id}`);
    return ok(data as PaymentRow);
  } catch (e) {
    return fail(e);
  }
}

export async function deletePayment(id: string): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data: existing, error: existingError } = await supabase
      .from('payments')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) throw new ActionError('not_found', 'Pembayaran tidak ditemukan.');

    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${existing.project_id}/finance`);
    revalidatePath(`/projects/${existing.project_id}`);
    return ok({ id, projectId: existing.project_id });
  } catch (e) {
    return fail(e);
  }
}

export async function setPaymentVerified(
  id: string,
  verified: boolean,
): Promise<ActionResult<PaymentRow>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('payments')
      .update({ verified })
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    revalidatePath('/finance');
    revalidatePath(`/projects/${data.project_id}/finance`);
    return ok(data as PaymentRow);
  } catch (e) {
    return fail(e);
  }
}

export async function summarizeFinance(opts: {
  from?: string;
  to?: string;
}): Promise<
  ActionResult<{
    total: number;
    count: number;
    byMethod: Record<PaymentMethod, number>;
    byMonth: Array<{ month: string; total: number }>;
  }>
> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    let req = supabase.from('payments').select('amount, method, paid_at');
    if (opts.from) req = req.gte('paid_at', opts.from);
    if (opts.to) req = req.lte('paid_at', opts.to);
    const { data, error } = await req;
    if (error) throw error;

    const byMethod = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0])) as Record<
      PaymentMethod,
      number
    >;
    const byMonthMap = new Map<string, number>();
    let total = 0;
    for (const p of data ?? []) {
      total += p.amount;
      if (p.method && PAYMENT_METHODS.includes(p.method as PaymentMethod)) {
        byMethod[p.method as PaymentMethod] += p.amount;
      }
      const month = p.paid_at?.slice(0, 7) ?? 'unknown';
      byMonthMap.set(month, (byMonthMap.get(month) ?? 0) + p.amount);
    }
    const byMonth = Array.from(byMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, totalAmt]) => ({ month, total: totalAmt }));

    return ok({ total, count: (data ?? []).length, byMethod, byMonth });
  } catch (e) {
    return fail(e);
  }
}
