'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  RecordFileSchema,
  SignedUploadRequestSchema,
} from '@/lib/schemas/file';
import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';

const BUCKET = 'project-files';

export type FileRow = {
  id: string;
  project_id: string | null;
  task_id: string | null;
  bucket: string;
  path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: string | null;
  uploaded_at: string;
};

function sanitizeFilename(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export async function getSignedUploadUrl(input: unknown): Promise<
  ActionResult<{ path: string; token: string; bucket: string }>
> {
  try {
    const user = await requireUser();
    const parsed = SignedUploadRequestSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Permintaan upload tidak valid.',
        parsed.error.flatten().fieldErrors,
      );
    }

    if (!ALLOWED_MIME_TYPES.has(parsed.data.content_type)) {
      throw new ActionError(
        'validation_error',
        'Tipe file tidak diizinkan. Coba PDF / DOCX / gambar / ZIP.',
      );
    }
    if (parsed.data.size_bytes > MAX_FILE_BYTES) {
      throw new ActionError('validation_error', 'Ukuran file melebihi 25 MB.');
    }

    const supabase = await getServerSupabase();

    // Pastikan project memang milik user (defense in depth meski RLS sudah handle).
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', parsed.data.project_id)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) throw new ActionError('not_found', 'Proyek tidak ditemukan.');

    const safeName = sanitizeFilename(parsed.data.filename) || 'file';
    const uuid = crypto.randomUUID();
    const path = `${user.id}/${parsed.data.project_id}/${uuid}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw error;

    return ok({ path: data.path, token: data.token, bucket: BUCKET });
  } catch (e) {
    return fail(e);
  }
}

export async function recordFileMetadata(input: unknown): Promise<ActionResult<FileRow>> {
  try {
    const user = await requireUser();
    const parsed = RecordFileSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Metadata file tidak valid.',
        parsed.error.flatten().fieldErrors,
      );
    }

    // Pastikan path berada di folder user (anti-spoofing).
    if (!parsed.data.path.startsWith(`${user.id}/`)) {
      throw new ActionError('forbidden', 'Path file tidak sesuai pemilik.');
    }

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('files')
      .insert({
        owner_id: user.id,
        project_id: parsed.data.project_id,
        task_id: parsed.data.task_id ?? null,
        bucket: BUCKET,
        path: parsed.data.path,
        filename: parsed.data.filename,
        mime_type: parsed.data.mime_type,
        size_bytes: parsed.data.size_bytes,
        category: parsed.data.category,
      })
      .select(
        'id, project_id, task_id, bucket, path, filename, mime_type, size_bytes, category, uploaded_at',
      )
      .single();
    if (error) throw error;

    revalidatePath(`/projects/${parsed.data.project_id}/files`);
    revalidatePath(`/projects/${parsed.data.project_id}`);
    return ok(data as FileRow);
  } catch (e) {
    return fail(e);
  }
}

export async function listFilesByProject(
  projectId: string,
): Promise<ActionResult<FileRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('files')
      .select(
        'id, project_id, task_id, bucket, path, filename, mime_type, size_bytes, category, uploaded_at',
      )
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as FileRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function getSignedDownloadUrl(
  fileId: string,
): Promise<ActionResult<{ url: string; filename: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('bucket, path, filename')
      .eq('id', fileId)
      .maybeSingle();
    if (fileError) throw fileError;
    if (!file) throw new ActionError('not_found', 'File tidak ditemukan.');

    const { data, error } = await supabase.storage
      .from(file.bucket)
      .createSignedUrl(file.path, 3600, { download: file.filename });
    if (error) throw error;

    return ok({ url: data.signedUrl, filename: file.filename });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFile(
  fileId: string,
): Promise<ActionResult<{ id: string; project_id: string | null }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('bucket, path, project_id')
      .eq('id', fileId)
      .maybeSingle();
    if (fileError) throw fileError;
    if (!file) throw new ActionError('not_found', 'File tidak ditemukan.');

    const { error: storageError } = await supabase.storage
      .from(file.bucket)
      .remove([file.path]);
    if (storageError) throw storageError;

    const { error: deleteError } = await supabase.from('files').delete().eq('id', fileId);
    if (deleteError) throw deleteError;

    if (file.project_id) {
      revalidatePath(`/projects/${file.project_id}/files`);
    }
    return ok({ id: fileId, project_id: file.project_id });
  } catch (e) {
    return fail(e);
  }
}
