'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  ClientCreateSchema,
  ClientUpdateSchema,
} from '@/lib/schemas/client';
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
};

export async function listClients(opts?: {
  includeArchived?: boolean;
}): Promise<ActionResult<ClientRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    let query = supabase
      .from('clients')
      .select(
        'id, full_name, nickname, whatsapp, email, university, faculty, major, student_id, semester, target_defense, source, notes, archived_at, created_at, updated_at',
      )
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

export async function getClient(id: string): Promise<ActionResult<ClientRow | null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select(
        'id, full_name, nickname, whatsapp, email, university, faculty, major, student_id, semester, target_defense, source, notes, archived_at, created_at, updated_at',
      )
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
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...parsed.data, owner_id: user.id })
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
    const { error } = await supabase
      .from('clients')
      .update(parsed.data)
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
