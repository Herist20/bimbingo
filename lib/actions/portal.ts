'use server';

import { revalidatePath } from 'next/cache';

import {
  ActionError,
  fail,
  ok,
  requireUser,
  type ActionResult,
} from './_helper';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  InviteClientSchema,
  RequestPortalOtpSchema,
  RevokeClientPortalSchema,
  VerifyPortalOtpSchema,
} from '@/lib/schemas/portal';

export async function inviteClientToPortal(
  input: unknown,
): Promise<ActionResult<{ userId: string }>> {
  try {
    await requireUser();
    const parsed = InviteClientSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Input tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const { clientId } = parsed.data;

    const supabase = await getServerSupabase();
    const { data: client, error: e1 } = await supabase
      .from('clients')
      .select('id, email, full_name, client_user_id')
      .eq('id', clientId)
      .single();
    if (e1) throw e1;
    if (!client) throw new ActionError('not_found', 'Klien tidak ditemukan');
    if (!client.email) {
      throw new ActionError(
        'validation_error',
        'Klien belum punya email. Tambahkan email dulu sebelum mengaktifkan portal.',
      );
    }
    if (client.client_user_id) {
      throw new ActionError(
        'conflict',
        'Klien sudah punya akses portal.',
      );
    }

    const admin = getAdminSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const { data: invited, error: e2 } = await admin.auth.admin.inviteUserByEmail(
      client.email,
      {
        data: { role: 'client', full_name: client.full_name },
        redirectTo: `${appUrl}/portal/auth/callback`,
      },
    );
    if (e2) {
      if (e2.message?.toLowerCase().includes('already registered')) {
        throw new ActionError(
          'conflict',
          'Email ini sudah dipakai akun lain. Gunakan email berbeda untuk klien.',
        );
      }
      throw e2;
    }
    if (!invited.user) throw new ActionError('internal', 'Gagal membuat akun klien.');

    const { error: e3 } = await supabase
      .from('clients')
      .update({ client_user_id: invited.user.id })
      .eq('id', clientId);
    if (e3) throw e3;

    revalidatePath(`/clients/${clientId}`);
    return ok({ userId: invited.user.id });
  } catch (e) {
    return fail(e);
  }
}

export async function revokeClientPortalAccess(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const parsed = RevokeClientPortalSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Input tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const { clientId } = parsed.data;

    const supabase = await getServerSupabase();
    const { data: client, error: e1 } = await supabase
      .from('clients')
      .select('id, client_user_id')
      .eq('id', clientId)
      .single();
    if (e1) throw e1;
    if (!client) throw new ActionError('not_found', 'Klien tidak ditemukan');
    if (!client.client_user_id) {
      throw new ActionError('conflict', 'Klien belum punya akses portal.');
    }

    const admin = getAdminSupabase();
    const { error: e2 } = await admin.auth.admin.deleteUser(client.client_user_id);
    if (e2) throw e2;

    const { error: e3 } = await supabase
      .from('clients')
      .update({ client_user_id: null })
      .eq('id', clientId);
    if (e3) throw e3;

    revalidatePath(`/clients/${clientId}`);
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function requestPortalOtp(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const parsed = RequestPortalOtpSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Email tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      throw new ActionError(
        'internal',
        'Gagal mengirim kode. Pastikan email Anda terdaftar dan coba lagi.',
      );
    }
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function verifyPortalOtp(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const parsed = VerifyPortalOtpSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'OTP tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: 'email',
    });
    if (error) {
      throw new ActionError(
        'unauthorized',
        'Kode salah atau sudah kadaluarsa. Coba lagi.',
      );
    }
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
