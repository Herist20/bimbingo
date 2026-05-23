# RLS smoke tests

Manual SQL scripts. Run via Supabase SQL editor (or `psql`) against the project
this app is linked to.

## How to run

1. Open the Supabase project in the dashboard.
2. Authentication -> Users -> note the UUIDs for the test users you want to use
   as substitution values (`:admin_a`, `:admin_b`, `:client_x`).
3. Open SQL editor.
4. Paste the script's body, substitute the placeholder UUIDs by hand
   (string-replace `:admin_a`, `:client_x`, etc.).
5. Run statements one-by-one. Each `select count(*)` has the expected value
   in the line below as a comment — compare manually.

If a count differs from the expected value, an RLS policy is misconfigured.

## Scripts

- `portal.sql` — Client Portal access policies (added 2026-05-22).
  Verifies that `client` role users see only their own client row,
  projects, milestones, and payments — and that the existing admin
  policies (owner_id-based) still work.
- `portal-interactive.sql` — Portal interactive lite (milestone_comments,
  files kategori scoping, notifications). Added 2026-05-22.
- `admin-isolation.sql` — Cross-admin tenant isolation (added 2026-05-23).
  Verifies admin_b tidak bisa SELECT/INSERT/UPDATE/DELETE row milik admin_a
  di semua 12 tabel domain (direct owner_id + parent-derived policies).
  Wajib di-run sebelum onboarding multi-admin atau saat add tabel baru.
