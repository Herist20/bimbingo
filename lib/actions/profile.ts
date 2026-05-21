'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { PasswordUpdateSchema, ProfileUpdateSchema } from '@/lib/schemas/profile';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

export async function updateProfile(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = ProfileUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Data profil tidak valid.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const patch: {
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
      updated_at: string;
      timezone?: string;
    } = {
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.timezone) patch.timezone = parsed.data.timezone;
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    if (error) throw error;
    revalidatePath('/settings/profile');
    revalidatePath('/', 'layout');
    return ok({ id: user.id });
  } catch (e) {
    return fail(e);
  }
}

export async function updatePassword(input: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireUser();
    const parsed = PasswordUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali input password.',
        parsed.error.flatten().fieldErrors as never,
      );
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.new_password,
    });
    if (error) throw new ActionError('internal', error.message);
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
