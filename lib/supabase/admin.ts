import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { serverEnv } from '@/lib/env';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client. Bypasses RLS — gunakan HANYA untuk:
 * - Cron jobs internal
 * - Webhook handlers terverifikasi
 * - Migration / seed script
 *
 * JANGAN PERNAH dipakai untuk operasi atas nama user yang sedang login.
 */
export function getAdminSupabase() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
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
