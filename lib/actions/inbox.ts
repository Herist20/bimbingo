'use server';

import { revalidatePath } from 'next/cache';

import { fail, ok, requireUser, type ActionResult } from './_helper';
import { getServerSupabase } from '@/lib/supabase/server';
import type { NotifType } from './_notify';

export type NotifRow = {
  id: string;
  type: NotifType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function listMyNotifications(opts?: {
  limit?: number;
}): Promise<ActionResult<NotifRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, payload, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(opts?.limit ?? 20);
    if (error) throw error;
    return ok(
      (data ?? []).map((r) => ({
        ...r,
        type: r.type as NotifType,
        payload: (r.payload ?? {}) as Record<string, unknown>,
      })),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function unreadNotificationCount(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw error;
    return ok({ count: count ?? 0 });
  } catch (e) {
    return fail(e);
  }
}

export async function markNotificationRead(
  id: string,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    if (error) throw error;
    revalidatePath('/portal');
    revalidatePath('/dashboard');
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    if (error) throw error;
    revalidatePath('/portal');
    revalidatePath('/dashboard');
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
