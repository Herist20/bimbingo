-- =============================================================
-- Fix: audit_logs trigger insert ditolak RLS, status update gagal
-- =============================================================
-- Trigger log_project_status_change() menulis ke audit_logs dalam
-- transaksi yang sama dengan UPDATE projects. Karena audit_logs hanya
-- punya policy SELECT, INSERT ditolak -> trigger gagal -> UPDATE
-- ter-rollback, status proyek tidak berubah.
--
-- Solusi: izinkan INSERT untuk user yang memang aktornya (atau
-- actor_id = null untuk job sistem seperti cron/webhook).

drop policy if exists "audit_logs_actor_insert" on public.audit_logs;

create policy "audit_logs_actor_insert"
  on public.audit_logs for insert
  with check (actor_id = auth.uid() or actor_id is null);
