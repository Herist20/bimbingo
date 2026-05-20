'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  MilestoneInputSchema,
  ProjectCreateSchema,
  ProjectUpdateSchema,
  PROJECT_STATUSES,
} from '@/lib/schemas/project';
import {
  buildCustomDataValidator,
  type CustomFieldRow,
} from '@/lib/schemas/custom-field';
import type { Json } from '@/types/database';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

async function fetchProjectCustomFields(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
): Promise<CustomFieldRow[]> {
  const { data, error } = await supabase
    .from('custom_fields')
    .select(
      'id, owner_id, entity_type, scope, scope_ref, key, label, description, field_type, options, required, default_value, sequence, show_in_form, show_in_list, show_in_card, archived_at, created_at, updated_at',
    )
    .eq('entity_type', 'project')
    .is('archived_at', null);
  if (error) throw error;
  return (data ?? []) as CustomFieldRow[];
}

function toJson(value: Record<string, unknown>): Json {
  return value as unknown as Json;
}

export type ProjectRow = {
  id: string;
  client_id: string;
  title: string;
  type: string;
  description: string | null;
  status: string;
  total_value: number;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  archived_at: string | null;
  custom_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProjectListRow = ProjectRow & {
  client_name: string;
  total_paid: number;
  outstanding: number;
  progress_percent: number;
};

export type ProjectMilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  sequence: number;
  due_date: string | null;
  status: string;
  weight_percent: number | null;
  notes: string | null;
};

export type ProjectLecturerLink = {
  project_id: string;
  lecturer_id: string;
  role: string;
  lecturer: {
    id: string;
    full_name: string;
    title: string | null;
    university: string | null;
  } | null;
};

const PROJECT_COLUMNS =
  'id, client_id, title, type, description, status, total_value, start_date, target_end_date, actual_end_date, archived_at, custom_data, created_at, updated_at';

export async function listProjects(opts?: {
  includeArchived?: boolean;
}): Promise<ActionResult<ProjectListRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();

    let projectsQuery = supabase
      .from('projects')
      .select(`${PROJECT_COLUMNS}, client:clients!inner(id, full_name)`)
      .order('updated_at', { ascending: false });

    if (!opts?.includeArchived) {
      projectsQuery = projectsQuery.is('archived_at', null);
    }

    const { data: projects, error: projectsError } = await projectsQuery;
    if (projectsError) throw projectsError;

    const projectIds = (projects ?? []).map((p) => p.id);
    if (projectIds.length === 0) return ok([]);

    const [{ data: finance, error: financeError }, { data: progress, error: progressError }] =
      await Promise.all([
        supabase
          .from('project_finance_summary')
          .select('project_id, total_paid, outstanding')
          .in('project_id', projectIds),
        supabase
          .from('project_progress_summary')
          .select('project_id, progress_percent')
          .in('project_id', projectIds),
      ]);
    if (financeError) throw financeError;
    if (progressError) throw progressError;

    const financeMap = new Map(
      (finance ?? []).map((f) => [f.project_id, { total_paid: f.total_paid ?? 0, outstanding: f.outstanding ?? 0 }]),
    );
    const progressMap = new Map(
      (progress ?? []).map((p) => [p.project_id, p.progress_percent ?? 0]),
    );

    const merged: ProjectListRow[] = (projects ?? []).map((p) => {
      const client = (p as unknown as { client?: { full_name?: string } }).client;
      const fin = financeMap.get(p.id) ?? { total_paid: 0, outstanding: p.total_value };
      return {
        id: p.id,
        client_id: p.client_id,
        title: p.title,
        type: p.type,
        description: p.description,
        status: p.status,
        total_value: p.total_value,
        start_date: p.start_date,
        target_end_date: p.target_end_date,
        actual_end_date: p.actual_end_date,
        archived_at: p.archived_at,
        custom_data: (p.custom_data as Record<string, unknown> | null) ?? {},
        created_at: p.created_at,
        updated_at: p.updated_at,
        client_name: client?.full_name ?? '—',
        total_paid: fin.total_paid,
        outstanding: fin.outstanding,
        progress_percent: progressMap.get(p.id) ?? 0,
      };
    });

    return ok(merged);
  } catch (e) {
    return fail(e);
  }
}

export async function getProject(id: string): Promise<
  ActionResult<{
    project: ProjectRow & { client: { id: string; full_name: string; whatsapp: string } | null };
    milestones: ProjectMilestoneRow[];
    lecturers: ProjectLecturerLink[];
    finance: { total_paid: number; outstanding: number; payment_count: number };
    progress_percent: number;
  } | null>
> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`${PROJECT_COLUMNS}, client:clients!inner(id, full_name, whatsapp)`)
      .eq('id', id)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return ok(null);

    const [
      { data: milestones, error: msError },
      { data: lecturers, error: lecError },
      { data: finance, error: finError },
      { data: progress, error: progError },
    ] = await Promise.all([
      supabase
        .from('project_milestones')
        .select('id, project_id, title, sequence, due_date, status, weight_percent, notes')
        .eq('project_id', id)
        .order('sequence', { ascending: true }),
      supabase
        .from('project_lecturers')
        .select('project_id, lecturer_id, role, lecturer:lecturers(id, full_name, title, university)')
        .eq('project_id', id),
      supabase
        .from('project_finance_summary')
        .select('total_paid, outstanding, payment_count')
        .eq('project_id', id)
        .maybeSingle(),
      supabase
        .from('project_progress_summary')
        .select('progress_percent')
        .eq('project_id', id)
        .maybeSingle(),
    ]);
    if (msError) throw msError;
    if (lecError) throw lecError;
    if (finError) throw finError;
    if (progError) throw progError;

    const clientRaw = (project as unknown as { client?: { id: string; full_name: string; whatsapp: string } | null })
      .client ?? null;

    return ok({
      project: {
        id: project.id,
        client_id: project.client_id,
        title: project.title,
        type: project.type,
        description: project.description,
        status: project.status,
        total_value: project.total_value,
        start_date: project.start_date,
        target_end_date: project.target_end_date,
        actual_end_date: project.actual_end_date,
        archived_at: project.archived_at,
        custom_data: (project.custom_data as Record<string, unknown> | null) ?? {},
        created_at: project.created_at,
        updated_at: project.updated_at,
        client: clientRaw,
      },
      milestones: (milestones ?? []) as ProjectMilestoneRow[],
      lecturers: (lecturers ?? []) as ProjectLecturerLink[],
      finance: {
        total_paid: finance?.total_paid ?? 0,
        outstanding: finance?.outstanding ?? project.total_value,
        payment_count: finance?.payment_count ?? 0,
      },
      progress_percent: progress?.progress_percent ?? 0,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function createProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  let createdProjectId: string | null = null;
  try {
    const user = await requireUser();
    const parsed = ProjectCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian formulir.',
        parsed.error.flatten().fieldErrors,
      );
    }

    const { milestones, lecturers, client_id, ...rest } = parsed.data;
    const supabase = await getServerSupabase();

    const fields = await fetchProjectCustomFields(supabase);
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

    const { data: inserted, error: insertError } = await supabase
      .from('projects')
      .insert({
        ...rest,
        client_id,
        owner_id: user.id,
        status: 'active',
        custom_data: toJson(cdResult.data),
      })
      .select('id')
      .single();
    if (insertError) throw insertError;
    createdProjectId = inserted.id;

    if (milestones.length > 0) {
      const seqs = milestones.map((m) => m.sequence);
      const unique = new Set(seqs);
      if (unique.size !== seqs.length) {
        throw new ActionError('validation_error', 'Urutan bab (sequence) tidak boleh duplikat.');
      }
      const { error: msError } = await supabase.from('project_milestones').insert(
        milestones.map((m) => ({
          project_id: createdProjectId!,
          title: m.title,
          sequence: m.sequence,
          due_date: m.due_date ?? null,
          weight_percent: m.weight_percent ?? null,
          status: m.status ?? 'not-started',
          notes: m.notes ?? null,
        })),
      );
      if (msError) throw msError;
    }

    if (lecturers.length > 0) {
      const roles = lecturers.map((l) => l.role);
      const uniqueRoles = new Set(roles);
      if (uniqueRoles.size !== roles.length) {
        throw new ActionError(
          'validation_error',
          'Satu peran (mis. Pembimbing 1) tidak boleh dipakai 2 dosen.',
        );
      }
      const { error: lecError } = await supabase.from('project_lecturers').insert(
        lecturers.map((l) => ({
          project_id: createdProjectId!,
          lecturer_id: l.lecturer_id,
          role: l.role,
        })),
      );
      if (lecError) throw lecError;
    }

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    revalidatePath(`/clients/${client_id}`);
    return ok({ id: createdProjectId });
  } catch (e) {
    // best-effort rollback
    if (createdProjectId) {
      try {
        const supabase = await getServerSupabase();
        await supabase.from('projects').delete().eq('id', createdProjectId);
      } catch {
        /* swallow rollback error */
      }
    }
    return fail(e);
  }
}

export async function updateProject(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const parsed = ProjectUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian formulir.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const { milestones, lecturers, ...rest } = parsed.data;
    const supabase = await getServerSupabase();

    const cdRaw = (input as { custom_data?: Record<string, unknown> } | null | undefined)?.custom_data;
    let custom_data: Json | undefined;
    if (cdRaw !== undefined) {
      const fields = await fetchProjectCustomFields(supabase);
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
    const patch = custom_data !== undefined ? { ...rest, custom_data } : rest;

    const { error } = await supabase.from('projects').update(patch).eq('id', id);
    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    // milestones/lecturers di-update lewat action terpisah supaya granular
    void milestones;
    void lecturers;
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function changeProjectStatus(
  id: string,
  status: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
      throw new ActionError('validation_error', 'Status tidak valid.');
    }
    const supabase = await getServerSupabase();
    const patch: { status: string; actual_end_date?: string } = { status };
    if (status === 'completed') patch.actual_end_date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('projects').update(patch).eq('id', id);
    if (error) throw error;
    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function archiveProject(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('projects')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/projects');
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function restoreProject(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('projects')
      .update({ archived_at: null })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/projects');
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function upsertMilestones(
  projectId: string,
  items: unknown,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireUser();
    const parsed = z.array(MilestoneInputSchema).safeParse(items);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Data bab tidak valid.',
        parsed.error.flatten().fieldErrors as never,
      );
    }
    const list = parsed.data;
    const seqs = list.map((m) => m.sequence);
    if (new Set(seqs).size !== seqs.length) {
      throw new ActionError('validation_error', 'Urutan bab tidak boleh duplikat.');
    }
    const totalWeight = list.reduce((s, m) => s + (m.weight_percent ?? 0), 0);
    if (totalWeight > 100) {
      throw new ActionError('validation_error', 'Total weight melebihi 100%.');
    }

    const supabase = await getServerSupabase();
    const { data: existing, error: existingError } = await supabase
      .from('project_milestones')
      .select('id')
      .eq('project_id', projectId);
    if (existingError) throw existingError;
    const existingIds = new Set((existing ?? []).map((m) => m.id));
    const keepIds = new Set(list.filter((m) => m.id).map((m) => m.id!));
    const toDelete = [...existingIds].filter((eid) => !keepIds.has(eid));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('project_milestones')
        .delete()
        .in('id', toDelete);
      if (deleteError) throw deleteError;
    }

    for (const m of list) {
      const payload = {
        title: m.title,
        sequence: m.sequence,
        due_date: m.due_date ?? null,
        weight_percent: m.weight_percent ?? null,
        status: m.status ?? 'not-started',
        notes: m.notes ?? null,
      };
      if (m.id) {
        const { error } = await supabase
          .from('project_milestones')
          .update(payload)
          .eq('id', m.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_milestones')
          .insert({ ...payload, project_id: projectId });
        if (error) throw error;
      }
    }

    revalidatePath(`/projects/${projectId}`);
    return ok({ count: list.length });
  } catch (e) {
    return fail(e);
  }
}

export async function attachLecturer(
  projectId: string,
  lecturerId: string,
  role: string,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('project_lecturers')
      .upsert({ project_id: projectId, lecturer_id: lecturerId, role });
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function detachLecturer(
  projectId: string,
  role: string,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('project_lecturers')
      .delete()
      .eq('project_id', projectId)
      .eq('role', role);
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

