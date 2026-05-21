-- Aktifkan publikasi Realtime untuk tabel kanban board.
-- RLS tetap diberlakukan: client subscriber hanya menerima event untuk
-- baris yang policy SELECT-nya lulus (owner_id via parent project).
--
-- Idempotent: pakai DO block + try/catch supaya migration aman di-rerun.

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.task_comments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- Pastikan replica identity FULL supaya event UPDATE & DELETE bawa
-- payload before+after (perlu untuk diff di client).
alter table public.tasks replica identity full;
alter table public.task_comments replica identity full;
