import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getServiceRoleKey, serverEnv } from '@/lib/env';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client. Bypasses RLS — gunakan HANYA untuk:
 * - Cron jobs internal
 * - Webhook handlers terverifikasi
 * - Server action admin-gated (mis. invite klien ke portal)
 * - Migration / seed script
 *
 * JANGAN PERNAH dipakai untuk operasi atas nama user yang sedang login.
 *
 * Throws kalau `SUPABASE_SERVICE_ROLE_KEY` belum di-set di environment.
 * Pemanggilan ini lazy — module loading tidak gagal walau env var hilang;
 * baru gagal saat fungsi ini benar-benar dipanggil.
 */
export function getAdminSupabase() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      getServiceRoleKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return adminClient;
}
