'use server';

import {
  ActionError, fail, ok, requireUser,
  type ActionResult,
} from './_helper';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';

export type PortalFileRow = {
  id: string;
  filename: string;
  category: string | null;
  size_bytes: number | null;
  uploaded_at: string;
  milestone_id: string | null;
};

const VISIBLE_CATEGORIES = ['draft', 'final', 'referensi'] as const;

export async function listMilestoneFiles(
  milestoneId: string,
): Promise<ActionResult<PortalFileRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('files')
      .select('id, filename, category, size_bytes, uploaded_at, milestone_id')
      .eq('milestone_id', milestoneId)
      .in('category', VISIBLE_CATEGORIES as unknown as string[])
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as PortalFileRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function getSignedFileUrl(
  fileId: string,
): Promise<ActionResult<{ url: string; filename: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data: f, error: e1 } = await supabase
      .from('files')
      .select('id, bucket, path, filename, category')
      .eq('id', fileId)
      .maybeSingle();
    if (e1) throw e1;
    if (!f) throw new ActionError('not_found', 'File tidak ditemukan.');

    const admin = getAdminSupabase();
    const { data: signed, error: e2 } = await admin.storage
      .from(f.bucket)
      .createSignedUrl(f.path, 300);
    if (e2 || !signed)
      throw e2 ?? new ActionError('internal', 'Gagal membuat link.');

    return ok({ url: signed.signedUrl, filename: f.filename });
  } catch (e) {
    return fail(e);
  }
}
