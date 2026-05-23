import 'server-only';
import type { Json } from '@/types/database';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type NotifType =
  | 'milestone_comment'
  | 'milestone_status'
  | 'payment_verified'
  | 'project_status'
  | 'invite_activated'
  | 'deadline_reminder';

export async function notifyUser(
  userId: string,
  type: NotifType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  const admin = getAdminSupabase();
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    payload: payload as Json,
  });
  if (error) console.error('[notify] insert failed', { type, userId, error });
}
