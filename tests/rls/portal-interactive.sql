-- Manual RLS smoke test for Portal Interactive Lite features.
-- Run from Supabase SQL editor. Substitute placeholders with real UUIDs:
--   :admin_a    = admin owner of Project_A (auth.users.id)
--   :admin_b    = different admin owner (auth.users.id)
--   :client_x   = auth user linked to Client X (clients.client_user_id)
--   <m_id>      = a milestone id under Project_A (owned by admin_a)
--   <f_draft>   = file id with category='draft' belonging to Project_A
--   <f_internal> = file id with category='lainnya'/'bukti-bayar' belonging to Project_A

-- =========================================================================
-- TEST 1: client_x inserts milestone_comment with author_role='client'
--         on milestone of their own project -> should succeed
-- =========================================================================
set local role = 'authenticated';
set local "request.jwt.claim.sub" = ':client_x';

insert into public.milestone_comments(milestone_id, author_id, author_role, body)
  values ('<m_id>', ':client_x'::uuid, 'client', 'Test komentar dari klien');
-- Expected: 1 row inserted.

-- =========================================================================
-- TEST 2: client_x inserts with author_role='admin' -> should be REJECTED
-- =========================================================================
insert into public.milestone_comments(milestone_id, author_id, author_role, body)
  values ('<m_id>', ':client_x'::uuid, 'admin', 'Mencoba pura-pura admin');
-- Expected: ERROR — new row violates row-level security policy

-- =========================================================================
-- TEST 3: client_x can SELECT comments di milestone proyeknya
-- =========================================================================
select count(*) as visible_comments from public.milestone_comments;
-- Expected: >= 1 (kalau ada admin yang sebelumnya post)

-- =========================================================================
-- TEST 4: client_x TIDAK boleh lihat notifications milik admin_a
-- =========================================================================
set local "request.jwt.claim.sub" = ':admin_a';
select count(*) as admin_a_unread from public.notifications where user_id = ':admin_a'::uuid and read_at is null;
-- Note hasilnya (X).

set local "request.jwt.claim.sub" = ':client_x';
select count(*) as client_visible_admin from public.notifications where user_id = ':admin_a'::uuid;
-- Expected: 0 (client tidak boleh lihat row admin)

-- =========================================================================
-- TEST 5: client_x boleh lihat file kategori 'draft' di proyeknya
-- =========================================================================
select count(*) as visible_draft from public.files where id = '<f_draft>';
-- Expected: 1

-- =========================================================================
-- TEST 6: client_x TIDAK boleh lihat file kategori internal
-- =========================================================================
select count(*) as leaked_internal from public.files where id = '<f_internal>';
-- Expected: 0 (RLS policy filter category in ('draft','final','referensi'))

-- =========================================================================
-- TEST 7: client_x TIDAK bisa update milestone_comment (no UPDATE policy)
-- =========================================================================
update public.milestone_comments set body = 'edited' where milestone_id = '<m_id>' and author_id = ':client_x'::uuid;
-- Expected: 0 rows affected (silent because RLS hides; or ERROR depending on Postgres version)

-- =========================================================================
-- TEST 8: admin_a SELECT semua comments di proyeknya
-- =========================================================================
set local "request.jwt.claim.sub" = ':admin_a';
select count(*) as admin_comments from public.milestone_comments;
-- Expected: >= count yang ada untuk milestone yang dimiliki admin_a

-- =========================================================================
-- TEST 9: admin_b TIDAK boleh lihat comments milik admin_a
-- =========================================================================
set local "request.jwt.claim.sub" = ':admin_b';
select count(*) as leaked_admin_a from public.milestone_comments where milestone_id = '<m_id>';
-- Expected: 0

-- Reset state
reset role;
reset "request.jwt.claim.sub";
