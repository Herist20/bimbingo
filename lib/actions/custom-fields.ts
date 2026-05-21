'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  CF_ENTITY_TYPES,
  CustomFieldCreateSchema,
  CustomFieldUpdateSchema,
  type CFEntityType,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

const COLUMNS =
  'id, owner_id, entity_type, scope, scope_ref, key, label, description, field_type, options, required, default_value, sequence, show_in_form, show_in_list, show_in_card, archived_at, created_at, updated_at';

function isEntity(value: string): value is CFEntityType {
  return (CF_ENTITY_TYPES as readonly string[]).includes(value);
}

export async function listCustomFields(
  entityType: CFEntityType,
  scopeRef?: string | null,
): Promise<ActionResult<CustomFieldRow[]>> {
  try {
    await requireUser();
    if (!isEntity(entityType)) {
      throw new ActionError('validation_error', 'Entitas tidak valid.');
    }
    const supabase = await getServerSupabase();
    let query = supabase
      .from('custom_fields')
      .select(COLUMNS)
      .eq('entity_type', entityType)
      .is('archived_at', null)
      .order('sequence', { ascending: true });

    if (scopeRef) {
      query = query.or(`scope.eq.global,and(scope.eq.project,scope_ref.eq.${scopeRef})`);
    } else {
      query = query.eq('scope', 'global');
    }

    const { data, error } = await query;
    if (error) throw error;
    return ok((data ?? []) as CustomFieldRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function createCustomField(input: unknown): Promise<ActionResult<CustomFieldRow>> {
  try {
    const user = await requireUser();
    const parsed = CustomFieldCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Definisi field tidak valid.',
        parsed.error.flatten().fieldErrors as never,
      );
    }
    if (!parsed.data.key) {
      throw new ActionError('validation_error', 'Key tidak boleh kosong setelah normalisasi.');
    }

    const supabase = await getServerSupabase();

    // Tentukan sequence baru
    const { data: lastRow } = await supabase
      .from('custom_fields')
      .select('sequence')
      .eq('owner_id', user.id)
      .eq('entity_type', parsed.data.entity_type)
      .order('sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sequence = (lastRow?.sequence ?? 0) + 1;

    const { data, error } = await supabase
      .from('custom_fields')
      .insert({
        owner_id: user.id,
        entity_type: parsed.data.entity_type,
        scope: parsed.data.scope,
        scope_ref: parsed.data.scope_ref ?? null,
        key: parsed.data.key,
        label: parsed.data.label,
        description: parsed.data.description ?? null,
        field_type: parsed.data.field_type,
        options: parsed.data.options,
        required: parsed.data.required,
        show_in_form: parsed.data.show_in_form,
        show_in_list: parsed.data.show_in_list,
        show_in_card: parsed.data.show_in_card,
        sequence,
      })
      .select(COLUMNS)
      .single();
    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ActionError(
          'conflict',
          'Key sudah dipakai pada entitas ini. Ubah label/key.',
        );
      }
      throw error;
    }

    revalidatePath(`/${parsed.data.entity_type === 'client' ? 'clients' : parsed.data.entity_type === 'project' ? 'projects' : parsed.data.entity_type === 'lecturer' ? 'lecturers' : parsed.data.entity_type === 'payment' ? 'finance' : 'projects'}`);
    return ok(data as CustomFieldRow);
  } catch (e) {
    return fail(e);
  }
}

export async function updateCustomField(
  id: string,
  input: unknown,
): Promise<ActionResult<CustomFieldRow>> {
  try {
    await requireUser();
    const parsed = CustomFieldUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Definisi field tidak valid.',
        parsed.error.flatten().fieldErrors as never,
      );
    }
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('custom_fields')
      .update(parsed.data)
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    revalidatePath(`/${data.entity_type === 'client' ? 'clients' : data.entity_type === 'project' ? 'projects' : data.entity_type === 'lecturer' ? 'lecturers' : data.entity_type === 'payment' ? 'finance' : 'projects'}`);
    return ok(data as CustomFieldRow);
  } catch (e) {
    return fail(e);
  }
}

export async function archiveCustomField(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('custom_fields')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select('entity_type')
      .single();
    if (error) throw error;
    revalidatePath(`/${data.entity_type === 'client' ? 'clients' : data.entity_type === 'project' ? 'projects' : data.entity_type === 'lecturer' ? 'lecturers' : data.entity_type === 'payment' ? 'finance' : 'projects'}`);
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function restoreCustomField(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('custom_fields')
      .update({ archived_at: null })
      .eq('id', id)
      .select('entity_type')
      .single();
    if (error) throw error;
    revalidatePath(`/${data.entity_type === 'client' ? 'clients' : data.entity_type === 'project' ? 'projects' : data.entity_type === 'lecturer' ? 'lecturers' : data.entity_type === 'payment' ? 'finance' : 'projects'}`);
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function reorderCustomFields(
  entityType: CFEntityType,
  orderedIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireUser();
    if (!isEntity(entityType)) {
      throw new ActionError('validation_error', 'Entitas tidak valid.');
    }
    const supabase = await getServerSupabase();
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (!id) continue;
      const { error } = await supabase
        .from('custom_fields')
        .update({ sequence: i + 1 })
        .eq('id', id);
      if (error) throw error;
    }
    revalidatePath(`/${entityType === 'client' ? 'clients' : entityType === 'project' ? 'projects' : entityType === 'lecturer' ? 'lecturers' : entityType === 'payment' ? 'finance' : 'projects'}`);
    return ok({ count: orderedIds.length });
  } catch (e) {
    return fail(e);
  }
}
