'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { clientEnv } from '@/lib/env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return browserClient;
}
