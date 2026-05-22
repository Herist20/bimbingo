'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  ClientCreateSchema,
  ClientUpdateSchema,
} from '@/lib/schemas/client';
import {
  buildCustomDataValidator,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';
import type { Json } from '@/types/database';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

export type ClientRow = {
  id: string;
  full_name: string;
  nickname: string | null;
  whatsapp: string;
  email: string | null;
  university: string | null;
  faculty: string | null;
  major: string | null;
  student_id: string | null;
  semester: number | null;
  target_defense: string | null;
  source: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  custom_data: Record<string, unknown>;
  client_user_id: string | null;
};

const COLUMNS =
  'id, full_name, nickname, whatsapp, email, university, faculty, major, student_id, semester, target_defense, source, notes, archived_at, created_at, updated_at, custom_data, client_user_id';

async function fetchClientCustomFields(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
): Promise<CustomFieldRow[]> {
  const { data, error } = await supabase
    .from('custom_fields')
    .select(
      'id, owner_id, entity_type, scope, scope_ref, key, label, description, field_type, options, required, default_value, sequence, show_in_form, show_in_list, show_in_card, archived_at, created_at, updated_at',
    )
    .eq('entity_type', 'client')
    .is('archived_at', null);
  if (error) throw error;
  return (data ?? []) as CustomFieldRow[];
}

function toJson(value: Record<string, unknown>): Json {
  return value as unknown as Json;
}

export async function listClients(opts?: {
  includeArchived?: boolean;
}): Promise<ActionResult<ClientRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    let query = supabase
      .from('clients')
      .select(COLUMNS)
      .order('target_defense', { ascending: true, nullsFirst: false });

    if (!opts?.includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ok((data ?? []) as ClientRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function searchClients(query: string): Promise<ActionResult<ClientRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const q = query.trim();
    let req = supabase
      .from('clients')
      .select(COLUMNS)
      .is('archived_at', null)
      .order('full_name', { ascending: true })
      .limit(20);
    if (q.length > 0) {
      req = req.or(`full_name.ilike.%${q}%,whatsapp.ilike.%${q}%,university.ilike.%${q}%`);
    }
    const { data, error } = await req;
    if (error) throw error;
    return ok((data ?? []) as ClientRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function getClient(id: string): Promise<ActionResult<ClientRow | null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return ok(data as ClientRow | null);
  } catch (e) {
    return fail(e);
  }
}

export async function createClient(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = ClientCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian formulir.',
        parsed.error.flatten().fieldErrors,
      );
    }

    const supabase = await getServerSupabase();

    const fields = await fetchClientCustomFields(supabase);
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
      .from('clients')
      .insert({
        ...parsed.data,
        owner_id: user.id,
        custom_data: toJson(cdResult.data),
      })
      .select('id')
      .single();
    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath('/dashboard');
    return ok({ id: data.id });
  } catch (e) {
    return fail(e);
  }
}

export async function updateClient(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const parsed = ClientUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian formulir.',
        parsed.error.flatten().fieldErrors,
      );
    }

    const supabase = await getServerSupabase();
    const cdRaw = (input as { custom_data?: Record<string, unknown> } | null | undefined)?.custom_data;

    let custom_data: Json | undefined;
    if (cdRaw !== undefined) {
      const fields = await fetchClientCustomFields(supabase);
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

    const patch =
      custom_data !== undefined ? { ...parsed.data, custom_data } : { ...parsed.data };

    const { error } = await supabase
      .from('clients')
      .update(patch)
      .eq('id', id);
    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath(`/clients/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function archiveClient(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('clients')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/clients');
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function restoreClient(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('clients')
      .update({ archived_at: null })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/clients');
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUuidArray(ids: unknown): string[] {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ActionError('validation_error', 'Daftar ID kosong.');
  }
  if (ids.length > 200) {
    throw new ActionError('validation_error', 'Maksimal 200 ID per operasi bulk.');
  }
  const valid: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
      throw new ActionError('validation_error', 'Format ID tidak valid.');
    }
    valid.push(id);
  }
  return valid;
}

export async function bulkArchiveClients(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireUser();
    const validIds = validateUuidArray(ids);
    const supabase = await getServerSupabase();
    const { error, count } = await supabase
      .from('clients')
      .update({ archived_at: new Date().toISOString() }, { count: 'exact' })
      .in('id', validIds)
      .is('archived_at', null);
    if (error) throw error;
    revalidatePath('/clients');
    return ok({ count: count ?? 0 });
  } catch (e) {
    return fail(e);
  }
}

export async function bulkRestoreClients(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireUser();
    const validIds = validateUuidArray(ids);
    const supabase = await getServerSupabase();
    const { error, count } = await supabase
      .from('clients')
      .update({ archived_at: null }, { count: 'exact' })
      .in('id', validIds)
      .not('archived_at', 'is', null);
    if (error) throw error;
    revalidatePath('/clients');
    return ok({ count: count ?? 0 });
  } catch (e) {
    return fail(e);
  }
}
