'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  TASK_STATUSES,
  TaskCommentSchema,
  TaskCreateSchema,
  TaskUpdateSchema,
  type TaskStatus,
} from '@/lib/schemas/task';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

export type TaskRow = {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type TaskCommentRow = {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

const TASK_COLUMNS =
  'id, project_id, milestone_id, title, description, status, priority, assignee_id, due_date, completed_at, order_index, created_at, updated_at';

const ORDER_STEP = 1000;

export async function listTasksByProject(
  projectId: string,
): Promise<ActionResult<TaskRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_COLUMNS)
      .eq('project_id', projectId)
      .order('status', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) throw error;
    return ok((data ?? []) as TaskRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function getTask(id: string): Promise<ActionResult<TaskRow | null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return ok(data as TaskRow | null);
  } catch (e) {
    return fail(e);
  }
}

export async function createTask(input: unknown): Promise<ActionResult<TaskRow>> {
  try {
    await requireUser();
    const parsed = TaskCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Data task tidak valid.',
        parsed.error.flatten().fieldErrors,
      );
    }

    const supabase = await getServerSupabase();

    // Tentukan order_index = max + step di kolom status yang sama.
    const { data: maxRow, error: maxError } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('project_id', parsed.data.project_id)
      .eq('status', parsed.data.status ?? 'backlog')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxError) throw maxError;

    const nextOrder = (maxRow?.order_index ?? 0) + ORDER_STEP;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: parsed.data.project_id,
        milestone_id: parsed.data.milestone_id ?? null,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status ?? 'backlog',
        priority: parsed.data.priority ?? 'medium',
        assignee_id: parsed.data.assignee_id ?? null,
        due_date: parsed.data.due_date ?? null,
        order_index: nextOrder,
      })
      .select(TASK_COLUMNS)
      .single();
    if (error) throw error;

    revalidatePath(`/projects/${parsed.data.project_id}/board`);
    revalidatePath(`/projects/${parsed.data.project_id}`);
    return ok(data as TaskRow);
  } catch (e) {
    return fail(e);
  }
}

export async function updateTask(
  id: string,
  input: unknown,
): Promise<ActionResult<TaskRow>> {
  try {
    await requireUser();
    const parsed = TaskUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Data task tidak valid.',
        parsed.error.flatten().fieldErrors,
      );
    }

    const supabase = await getServerSupabase();
    type TaskPatch = {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      assignee_id?: string | null;
      due_date?: string | null;
      milestone_id?: string | null;
      completed_at?: string | null;
    };
    const patch: TaskPatch = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      (patch as Record<string, unknown>)[k] = v ?? null;
    }
    if (patch.status === 'done') patch.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select(TASK_COLUMNS)
      .single();
    if (error) throw error;

    revalidatePath(`/projects/${data.project_id}/board`);
    return ok(data as TaskRow);
  } catch (e) {
    return fail(e);
  }
}

/**
 * Pindahkan task ke status & posisi tertentu. Dipanggil saat drag-end di
 * kanban. Hitung order_index baru di server berdasar id task tetangga
 * (beforeId / afterId) supaya konsisten tanpa client perlu hitung pecahan.
 */
export async function moveTask(input: {
  taskId: string;
  toStatus: TaskStatus;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult<TaskRow>> {
  try {
    await requireUser();
    const { taskId, toStatus, beforeId, afterId } = input;
    if (!TASK_STATUSES.includes(toStatus)) {
      throw new ActionError('validation_error', 'Status target tidak valid.');
    }

    const supabase = await getServerSupabase();

    // Ambil tetangga untuk hitung order_index baru.
    let neighborBefore: number | null = null;
    let neighborAfter: number | null = null;
    if (beforeId) {
      const { data, error } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('id', beforeId)
        .maybeSingle();
      if (error) throw error;
      neighborBefore = data?.order_index ?? null;
    }
    if (afterId) {
      const { data, error } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('id', afterId)
        .maybeSingle();
      if (error) throw error;
      neighborAfter = data?.order_index ?? null;
    }

    let newOrder: number;
    if (neighborBefore !== null && neighborAfter !== null) {
      newOrder = (neighborBefore + neighborAfter) / 2;
    } else if (neighborBefore !== null) {
      newOrder = neighborBefore + ORDER_STEP;
    } else if (neighborAfter !== null) {
      newOrder = neighborAfter - ORDER_STEP;
    } else {
      newOrder = ORDER_STEP;
    }

    const patch: {
      status: string;
      order_index: number;
      completed_at: string | null;
    } = {
      status: toStatus,
      order_index: newOrder,
      completed_at: toStatus === 'done' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .select(TASK_COLUMNS)
      .single();
    if (error) throw error;

    revalidatePath(`/projects/${data.project_id}/board`);
    return ok(data as TaskRow);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTask(id: string): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data: existing, error: existingError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) throw new ActionError('not_found', 'Task tidak ditemukan.');

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    revalidatePath(`/projects/${existing.project_id}/board`);
    return ok({ id, projectId: existing.project_id });
  } catch (e) {
    return fail(e);
  }
}

export async function listTaskComments(taskId: string): Promise<ActionResult<TaskCommentRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('task_comments')
      .select('id, task_id, author_id, body, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as TaskCommentRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function addTaskComment(input: unknown): Promise<ActionResult<TaskCommentRow>> {
  try {
    const user = await requireUser();
    const parsed = TaskCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Komentar tidak valid.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: parsed.data.task_id,
        body: parsed.data.body,
        author_id: user.id,
      })
      .select('id, task_id, author_id, body, created_at')
      .single();
    if (error) throw error;
    return ok(data as TaskCommentRow);
  } catch (e) {
    return fail(e);
  }
}
