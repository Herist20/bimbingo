-- Manual RLS smoke test: cross-admin tenant isolation.
-- Verifikasi admin_b tidak bisa lihat/modify data milik admin_a di semua tabel.
-- Wajib di-run sebelum onboarding multi-admin (fase 3) atau saat add tabel domain baru.
--
-- Pre-conditions (set up via dashboard atau seed manual):
--   - Admin A (auth user :admin_a) sudah punya minimal 1 row di tiap tabel domain:
--     clients, lecturers, projects, project_milestones, tasks, payments,
--     client_notes, files, custom_fields, audit_logs
--   - Admin B (auth user :admin_b) di-create di Authentication tapi tidak punya data
--   - <project_a> = id project milik admin_a (untuk query parent-derived tables)
--   - <task_a> = id task di project_a
--   - <client_a> = id client di project_a
--
-- Cara pakai: substitute placeholders di bawah, jalankan blok-per-blok di SQL editor.
-- Setiap query punya "Expected" — kalau hasil beda, RLS bocor → fix policy.

-- =========================================================================
-- SETUP: switch ke admin_b context
-- =========================================================================
set local role = 'authenticated';
set local "request.jwt.claim.sub" = ':admin_b';

-- =========================================================================
-- TEST 1: clients — direct owner_id policy
-- =========================================================================
select count(*) as leaked_clients from public.clients;
-- Expected: 0 (admin_b tidak ada client sendiri, harus 0 row visible)

-- =========================================================================
-- TEST 2: lecturers — direct owner_id policy
-- =========================================================================
select count(*) as leaked_lecturers from public.lecturers;
-- Expected: 0

-- =========================================================================
-- TEST 3: projects — direct owner_id policy
-- =========================================================================
select count(*) as leaked_projects from public.projects;
-- Expected: 0

-- =========================================================================
-- TEST 4: files — direct owner_id policy
-- =========================================================================
select count(*) as leaked_files from public.files;
-- Expected: 0

-- =========================================================================
-- TEST 5: custom_fields — direct owner_id policy
-- =========================================================================
select count(*) as leaked_custom_fields from public.custom_fields;
-- Expected: 0

-- =========================================================================
-- TEST 6: project_milestones — parent-derived (via project)
-- =========================================================================
select count(*) as leaked_milestones from public.project_milestones;
-- Expected: 0

-- =========================================================================
-- TEST 7: project_lecturers — parent-derived (via project)
-- =========================================================================
select count(*) as leaked_project_lecturers from public.project_lecturers;
-- Expected: 0

-- =========================================================================
-- TEST 8: tasks — parent-derived (via project)
-- =========================================================================
select count(*) as leaked_tasks from public.tasks;
-- Expected: 0

-- =========================================================================
-- TEST 9: task_comments — parent-derived (via task → project)
-- =========================================================================
select count(*) as leaked_task_comments from public.task_comments;
-- Expected: 0

-- =========================================================================
-- TEST 10: payments — parent-derived (via project)
-- =========================================================================
select count(*) as leaked_payments from public.payments;
-- Expected: 0

-- =========================================================================
-- TEST 11: client_notes — parent-derived (via client → owner)
-- =========================================================================
select count(*) as leaked_client_notes from public.client_notes;
-- Expected: 0

-- =========================================================================
-- TEST 12: audit_logs — actor scoping (actor_id = auth.uid())
-- =========================================================================
select count(*) as leaked_audit from public.audit_logs;
-- Expected: 0 (admin_b belum punya action)

-- =========================================================================
-- TEST 13: profile read — admin_b harus hanya lihat profile diri sendiri
-- =========================================================================
select count(*) as visible_profiles from public.profiles;
-- Expected: 1 (profile own only)

-- =========================================================================
-- TEST 14: INSERT cross-tenant ke project admin_a (sebagai admin_b)
--          via tabel parent-derived → harus REJECTED via WITH CHECK
-- =========================================================================
insert into public.tasks(project_id, title, status, position)
  values ('<project_a>', 'Task selundupan', 'todo', 0);
-- Expected: ERROR — new row violates row-level security policy

insert into public.payments(project_id, amount_idr, paid_at, label)
  values ('<project_a>', 100000, now(), 'Pembayaran fake');
-- Expected: ERROR — new row violates row-level security policy

insert into public.project_milestones(project_id, title, weight_percent, position)
  values ('<project_a>', 'Milestone fake', 10, 99);
-- Expected: ERROR — new row violates row-level security policy

-- =========================================================================
-- TEST 15: UPDATE row admin_a (sebagai admin_b) → 0 rows affected
-- =========================================================================
update public.projects set title = 'hijacked' where id = '<project_a>';
-- Expected: 0 rows (RLS hide, no error)

update public.tasks set title = 'hijacked' where id = '<task_a>';
-- Expected: 0 rows

update public.clients set full_name = 'hijacked' where id = '<client_a>';
-- Expected: 0 rows

-- =========================================================================
-- TEST 16: DELETE row admin_a (sebagai admin_b) → 0 rows affected
-- =========================================================================
delete from public.projects where id = '<project_a>';
-- Expected: 0 rows

-- =========================================================================
-- SANITY: switch balik ke admin_a, pastikan policy owner masih jalan
-- =========================================================================
set local "request.jwt.claim.sub" = ':admin_a';
select count(*) as admin_a_clients from public.clients;
-- Expected: >=1

select count(*) as admin_a_projects from public.projects;
-- Expected: >=1

select count(*) as admin_a_tasks from public.tasks;
-- Expected: >=0 (tergantung apakah admin_a buat task)

-- Reset state
reset role;
reset "request.jwt.claim.sub";
