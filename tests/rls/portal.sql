-- Manual RLS smoke test for Client Portal.
-- Run from Supabase SQL editor or psql against the same project as the app.
--
-- Pre-conditions (set up test data first via dashboard or SQL):
--   - Admin A (auth user :admin_a) owns Client X and Project_A (client_id = X)
--   - Admin B (auth user :admin_b) owns Client Y and Project_B (client_id = Y)
--   - Client X invited to portal -> auth user :client_x linked
--     (clients.client_user_id = :client_x for row X)

-- TEST 1: as client_x, should see only Client X
set local role = 'authenticated';
set local "request.jwt.claim.sub" = ':client_x';

select count(*) as visible_clients from public.clients;
-- Expected: 1

select count(*) as visible_projects from public.projects;
-- Expected: 1 (Project_A only)

select count(*) as visible_milestones from public.project_milestones;
-- Expected: count of milestones under Project_A

select count(*) as visible_payments from public.payments;
-- Expected: count of payments under Project_A only

-- TEST 2: as client_x, must NOT see admin B's data
select count(*) as leaked_client_y
  from public.clients where id <> (
    select id from public.clients where client_user_id = ':client_x'
  );
-- Expected: 0

-- TEST 3: as admin_a, existing owner_id policy still works (sanity)
set local "request.jwt.claim.sub" = ':admin_a';
select count(*) as admin_a_clients from public.clients;
-- Expected: 1+ (all clients owned by admin A)

reset role;
reset "request.jwt.claim.sub";
