/**
 * Placeholder types. Akan di-generate ulang oleh Supabase CLI setelah migrasi
 * pertama diaplikasikan ke project Supabase:
 *
 *   pnpm db:types
 *
 * (lihat docs/08-deployment-devops.md section 4.4)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
