'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { ActionError, fail, ok, type ActionResult } from './_helper';
import { SendMagicLinkSchema, SignInWithPasswordSchema } from '@/lib/schemas/auth';
import { serverEnv } from '@/lib/env';

export async function signInWithPassword(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = SignInWithPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError('validation_error', 'Input tidak valid', parsed.error.flatten().fieldErrors);
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      // Pesan generik untuk menghindari leak info enum email/password.
      throw new ActionError('unauthorized', 'Email atau password salah.');
    }

    revalidatePath('/', 'layout');
    return ok({ redirectTo: '/dashboard' });
  } catch (e) {
    return fail(e);
  }
}

export async function sendMagicLink(input: unknown): Promise<ActionResult<{ email: string }>> {
  try {
    const parsed = SendMagicLinkSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError('validation_error', 'Format email tidak valid', parsed.error.flatten().fieldErrors);
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${serverEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new ActionError('internal', error.message);
    }

    return ok({ email: parsed.data.email });
  } catch (e) {
    return fail(e);
  }
}

export async function signOut(): Promise<never> {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}
