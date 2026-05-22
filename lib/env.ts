import { z } from 'zod';

const ServerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const ClientEnvSchema = ServerEnvSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
});

function readServerEnv() {
  const raw = process.env;
  const parsed = ServerEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: raw.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: raw.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `[env] Konfigurasi tidak lengkap: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}. Cek .env.local`,
    );
  }
  return parsed.data;
}

function readClientEnv() {
  return ClientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export const serverEnv = typeof window === 'undefined' ? readServerEnv() : (null as never);
export const clientEnv = readClientEnv();

// Service-role key dibaca lazy — hanya saat operasi admin (invite/cron/webhook)
// benar-benar dipanggil. Mencegah env var ini menjadi syarat module-load untuk
// route yang sekadar IMPORT (tapi tidak invoke) `getAdminSupabase`.
export function getServiceRoleKey(): string {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v || v.length < 20) {
    throw new Error(
      '[env] SUPABASE_SERVICE_ROLE_KEY belum di-set di environment. Tambahkan di Vercel Project Settings → Environment Variables.',
    );
  }
  return v;
}
