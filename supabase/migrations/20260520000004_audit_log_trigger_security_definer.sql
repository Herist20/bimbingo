-- =============================================================
-- Fix lanjutan: trigger log_project_status_change harus SECURITY DEFINER
-- =============================================================
-- Bahkan dengan INSERT policy di migrasi 0003, RLS bisa tetap menolak
-- bila auth.uid() di dalam konteks trigger return NULL pada kombinasi
-- versi Supabase/Postgres tertentu (gejala: error 42501 "new row violates
-- row-level security policy for table audit_logs").
--
-- Solusi paling andal: jalankan trigger function sebagai owner (postgres),
-- sehingga RLS audit_logs tidak diperiksa untuk insert internal ini.
-- Aman karena function hanya dipanggil oleh trigger, payload-nya sudah
-- terkontrol, dan tidak menerima input dari user.

create or replace function public.log_project_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (
      actor_id, entity_type, entity_id, action, before_data, after_data
    )
    values (
      auth.uid(),
      'project',
      new.id,
      'status_change',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;
