'use server';

import { revalidatePath } from 'next/cache';

import {
  ActionError, fail, ok, requireUser,
  type ActionResult,
} from './_helper';
import { getServerSupabase } from '@/lib/supabase/server';
import { notifyUser } from './_notify';
import {
  PostMilestoneCommentSchema,
  type MilestoneCommentRow,
} from '@/lib/schemas/portal-comments';

export async function postMilestoneComment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = PostMilestoneCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Komentar tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const authorRole: 'admin' | 'client' =
      profile?.role === 'client' ? 'client' : 'admin';

    const { data: ins, error: e1 } = await supabase
      .from('milestone_comments')
      .insert({
        milestone_id: parsed.data.milestoneId,
        author_id: user.id,
        author_role: authorRole,
        body: parsed.data.body,
      })
      .select('id')
      .single();
    if (e1) throw e1;

    // Resolve context for notification recipient
    const { data: m } = await supabase
      .from('project_milestones')
      .select('id, title, project_id')
      .eq('id', parsed.data.milestoneId)
      .maybeSingle();

    const projectId = m?.project_id ?? '';
    if (m) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, title, owner_id, client_id')
        .eq('id', m.project_id)
        .maybeSingle();
      if (project) {
        const { data: client } = await supabase
          .from('clients')
          .select('client_user_id')
          .eq('id', project.client_id)
          .maybeSingle();
        const recipientId =
          authorRole === 'client' ? project.owner_id : client?.client_user_id;
        if (recipientId && recipientId !== user.id) {
          await notifyUser(recipientId, 'milestone_comment', {
            milestone_id: parsed.data.milestoneId,
            milestone_title: m.title,
            project_id: project.id,
            project_title: project.title,
            comment_id: ins.id,
            by_role: authorRole,
          });
        }
      }
    }

    if (projectId) {
      revalidatePath(`/portal/proyek/${projectId}`);
      revalidatePath(`/projects/${projectId}/comments`);
    }
    return ok({ id: ins.id });
  } catch (e) {
    return fail(e);
  }
}

export async function listMilestoneComments(
  milestoneId: string,
): Promise<ActionResult<MilestoneCommentRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('milestone_comments')
      .select('id, author_id, author_role, body, created_at')
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const ids = Array.from(
      new Set((data ?? []).map((r) => r.author_id).filter(Boolean)),
    ) as string[];
    const probe = ids.length ? ids : ['00000000-0000-0000-0000-000000000000'];
    const [{ data: profiles }, { data: clients }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', probe),
      supabase
        .from('clients')
        .select('client_user_id, full_name, nickname')
        .in('client_user_id', probe),
    ]);
    const nameBy = new Map<string, string>();
    for (const p of profiles ?? []) nameBy.set(p.id, p.full_name);
    for (const c of clients ?? []) {
      if (c.client_user_id)
        nameBy.set(c.client_user_id, c.nickname ?? c.full_name);
    }

    return ok(
      (data ?? []).map((r) => ({
        id: r.id,
        author_id: r.author_id,
        author_role: r.author_role as 'admin' | 'client',
        author_name: r.author_id
          ? (nameBy.get(r.author_id) ?? 'Pengguna')
          : 'Pengguna',
        body: r.body,
        created_at: r.created_at,
      })),
    );
  } catch (e) {
    return fail(e);
  }
}
