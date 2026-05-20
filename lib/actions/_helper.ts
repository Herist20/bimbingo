'use server';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase/server';

export type ActionErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'validation_error'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ActionErrorCode; message: string; fields?: Record<string, string[]> } };

export class ActionError extends Error {
  constructor(
    public code: ActionErrorCode,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<User> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ActionError('unauthorized', 'Sesi tidak valid. Silakan masuk kembali.');
  }
  return data.user;
}

export async function requireUserOrRedirect(): Promise<User> {
  try {
    return await requireUser();
  } catch {
    redirect('/login');
  }
}

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(err: unknown): ActionResult<T> {
  if (err instanceof ActionError) {
    return { ok: false, error: { code: err.code, message: err.message, fields: err.fields } };
  }
  console.error('[action] unexpected error:', err);
  return {
    ok: false,
    error: { code: 'internal', message: 'Terjadi kesalahan internal. Coba lagi sebentar.' },
  };
}
