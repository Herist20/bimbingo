'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  LecturerCreateSchema,
  LecturerUpdateSchema,
} from '@/lib/schemas/lecturer';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

export type LecturerRow = {
  id: string;
  full_name: string;
  title: string | null;
  university: string | null;
  faculty: string | null;
  email: string | null;
  whatsapp: string | null;
  characteristics: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, full_name, title, university, faculty, email, whatsapp, characteristics, tags, created_at, updated_at';

export async function listLecturers(): Promise<ActionResult<LecturerRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('lecturers')
      .select(COLUMNS)
      .order('full_name', { ascending: true });
    if (error) throw error;
    return ok((data ?? []) as LecturerRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function getLecturer(id: string): Promise<ActionResult<LecturerRow | null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('lecturers')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return ok(data as LecturerRow | null);
  } catch (e) {
    return fail(e);
  }
}

export async function searchLecturers(query: string): Promise<ActionResult<LecturerRow[]>> {
  try {
    await requireUser();
    const q = query.trim();
    const supabase = await getServerSupabase();
    let req = supabase
      .from('lecturers')
      .select(COLUMNS)
      .order('full_name', { ascending: true })
      .limit(20);
    if (q.length > 0) {
      req = req.or(`full_name.ilike.%${q}%,university.ilike.%${q}%`);
    }
    const { data, error } = await req;
    if (error) throw error;
    return ok((data ?? []) as LecturerRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function createLecturer(input: unknown): Promise<ActionResult<{ id: string; lecturer: LecturerRow }>> {
  try {
    const user = await requireUser();
    const parsed = LecturerCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian formulir.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('lecturers')
      .insert({ ...parsed.data, owner_id: user.id })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    revalidatePath('/lecturers');
    return ok({ id: data.id, lecturer: data as LecturerRow });
  } catch (e) {
    return fail(e);
  }
}

export async function updateLecturer(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const parsed = LecturerUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Periksa kembali isian formulir.',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('lecturers').update(parsed.data).eq('id', id);
    if (error) throw error;
    revalidatePath('/lecturers');
    revalidatePath(`/lecturers/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteLecturer(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('lecturers').delete().eq('id', id);
    if (error) {
      // 23503 = foreign_key_violation (lecturer masih dipakai project_lecturers)
      if ((error as { code?: string }).code === '23503') {
        throw new ActionError(
          'conflict',
          'Dosen masih terhubung ke proyek. Lepas tautan terlebih dahulu sebelum menghapus.',
        );
      }
      throw error;
    }
    revalidatePath('/lecturers');
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}
