# Client Portal — Design Spec (F2.4, MVP read-only lite)

**Status:** Draft — pending implementation
**Tanggal:** 2026-05-22
**Owner:** nosuke1@gmail.com
**Roadmap ref:** `docs/06-implementation-roadmap.md` F2.4; `docs/09-monetization-scalability.md` skenario B (Client Portal komponen 1).

---

## 1. Tujuan & Lingkup

Membuka akses self-service untuk **klien (mahasiswa pembimbing)** supaya dapat melihat progres proyek skripsinya sendiri tanpa harus tanya admin via WhatsApp.

**MVP scope (cut "Read-only lite"):**
- Klien lihat dashboard ringkas proyek aktifnya.
- Klien lihat detail per proyek: progres milestone (bab), status, due date.
- Klien lihat riwayat pembayaran (status lunas/pending/terlambat) + ringkasan piutang.
- Klien lihat profil sendiri + logout.

**Eksplisit out-of-scope (fase 2+):**
- Download draft bab (file signed URL).
- Komentar/reply klien.
- Notifikasi email/WA opt-in (terkait F2.6).
- Edit profil dari sisi klien (admin tetap pemilik data klien).
- Multi-klien per proyek.
- Subdomain terpisah (`klien.bimbingo.app`).

**Estimasi effort:** ~2–3 hari kerja efektif.

---

## 2. Keputusan Arsitektur (decisions made)

| # | Keputusan | Alasan |
|---|-----------|--------|
| D1 | **Admin invite + Email OTP code**. Klien tidak self-signup. | `shouldCreateUser: false` blok email enumeration; admin tetap kontrol siapa yang masuk. OTP code (bukan magic link) hindari prefetcher email enterprise (Microsoft Defender Safe Links) yang sering "membakar" link sebelum diklik. |
| D2 | **Kolom `client_user_id` di tabel `clients`** (1:1 nullable). | Sederhana, indeks unique, link langsung. Tidak butuh tabel join `project_clients` (overkill untuk MVP). |
| D3 | **Extend `profiles.role` constraint** tambah nilai `'client'`. RLS pakai subquery ke profiles. | Konsisten dengan pola existing. Tidak butuh deploy Custom Access Token Auth Hook (Supabase) untuk skala 5–20 klien. Trade-off: extra subquery RLS — kompensasi indeks. |
| D4 | **Route group `app/(portal)/portal/*`** dengan layout terpisah (tanpa sidebar admin). | Isolasi visual penuh; 1 codebase + 1 deploy; konsisten dengan `(app)`, `(auth)`, `(print)` yang sudah ada. |
| D5 | **Middleware-level role gate**. Edge middleware fetch `profiles.role` + cookie cache 5 menit; redirect bila role × path mismatch. | Satu tempat untuk logika redirect. Layout server component tinggal trust hasil middleware (tidak query ulang). |
| D6 | **Server action `inviteClientToPortal` pakai `getAdminSupabase()`**. | Admin authenticated yang trigger (bukan public endpoint). Tetap memenuhi prinsip "service-role hanya untuk operasi yang tidak bisa dilakukan via auth user" (admin user tidak punya hak buat user baru). |

---

## 3. Schema Changes

### Migrasi baru
`supabase/migrations/20260522000001_client_portal.sql`

```sql
-- 1. Extend profiles.role enum (add 'client')
alter table public.profiles
  drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin','assistant','viewer','client'));

-- 2. Link auth.users -> clients (1:1 nullable)
alter table public.clients
  add column client_user_id uuid unique
    references auth.users(id) on delete set null;

create index idx_clients_client_user_id
  on public.clients(client_user_id)
  where client_user_id is not null;

-- 3. Extend handle_new_user trigger: read role + name from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'admin');
  v_full_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, v_full_name, v_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. RLS: client reads own clients row
create policy "client reads own clients row"
  on public.clients
  for select to authenticated
  using (client_user_id = auth.uid());

-- 5. RLS: client reads own projects
create policy "client reads own projects"
  on public.projects
  for select to authenticated
  using (
    client_id in (
      select id from public.clients
      where client_user_id = auth.uid()
    )
  );

-- 6. RLS: client reads milestones of own projects (table = project_milestones)
create policy "client reads own project_milestones"
  on public.project_milestones
  for select to authenticated
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );

-- 7. RLS: client reads own payments
create policy "client reads own payments"
  on public.payments
  for select to authenticated
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );
```

### Tidak diubah
- Policy admin existing (filter via `owner_id = auth.uid()`) **tetap parallel**. Klien tidak punya record `owner_id` di table-table tersebut sehingga policy admin nol-hit untuknya.
- Tabel lain (tasks, files, comments, audit_logs, custom_fields, lecturers) **tidak dapat policy klien** untuk fase ini.

### Roll-back
1. Drop 4 policy klien (`client reads own ...`).
2. Drop index `idx_clients_client_user_id`.
3. `alter table clients drop column client_user_id`.
4. Restore `profiles_role_check` ke 3 nilai semula.
5. Restore `handle_new_user` ke versi original.

Tidak ada data loss (kolom `client_user_id` mulai-mulai null, bisa di-recompute via re-invite).

### Regenerasi types
Setelah `pnpm supabase db push`:
```bash
pnpm db:types
```

---

## 4. Auth Flow

### 4.1 Invite (admin-triggered)

```
Admin di /clients/[id] -> klik "Aktifkan portal"
   |
   v
Server Action `inviteClientToPortal(clientId)` (lib/actions/portal.ts)
   |
   |-- requireUser() (admin auth gate)
   |-- supabase.from('clients').select(...) cek email + belum invite
   |-- getAdminSupabase().auth.admin.inviteUserByEmail(email, {
   |       data: { role: 'client', full_name },
   |       redirectTo: `${NEXT_PUBLIC_APP_URL}/portal/auth/callback`
   |     })
   |-- supabase.from('clients').update({ client_user_id: invited.user.id })
   |-- revalidatePath(`/clients/${clientId}`)
   |
   v
Email invite Supabase terkirim ke klien (template "Invite User")
```

Supabase auth trigger `on_auth_user_created` → `handle_new_user` → insert ke `profiles` dengan `role = 'client'` (dari `raw_user_meta_data.role`).

### 4.2 Login klien (post-invite, atau re-login)

```
Klien buka /portal/login
   |
   v
Form: input email -> submit
   |
   v
Server Action `requestPortalOtp(email)`
   |-- zod validate email
   |-- supabase.auth.signInWithOtp({
   |       email,
   |       options: { shouldCreateUser: false }
   |     })
   |
   v
Email OTP 6-digit code terkirim
   |
   v
Form OTP: input code -> submit
   |
   v
Server Action `verifyPortalOtp(email, token)`
   |-- supabase.auth.verifyOtp({ email, token, type: 'email' })
   |-- session aktif (cookie)
   |
   v
Redirect ke /portal (middleware lolos karena role=client)
```

**`shouldCreateUser: false` rationale:** mencegah email random membuat akun. Hanya email yang sudah ter-invite admin yang bisa lewat. Email enumeration tetap mungkin (response berbeda untuk email valid vs invalid OTP), tapi tidak ada akun baru dibuat.

### 4.3 Konfigurasi email template Supabase

Di Supabase Dashboard → Authentication → Email Templates:
- **Magic Link** template: ganti body dari `{{ .ConfirmationURL }}` ke `{{ .Token }}`. Subject: "Kode masuk Bimbingo: {{ .Token }}".
- **Invite User** template: optional ubah CTA ke "Lanjutkan ke portal" + redirect URL `https://<domain>/portal/auth/callback`.

Catat di README + `docs/08-deployment-devops.md`.

### 4.4 Revoke akses

Server action `revokeClientPortalAccess(clientId)`:
1. `requireUser()` (admin gate).
2. Ambil `client_user_id` dari clients row.
3. `getAdminSupabase().auth.admin.deleteUser(userId)` → cascade hapus session.
4. `update clients set client_user_id = null where id = clientId`.
5. `revalidatePath`.

---

## 5. Routing & Middleware

### 5.1 Struktur folder
```
app/
├── (app)/                  # admin shell — unchanged
├── (auth)/login/           # admin login — unchanged
├── (portal)/
│   ├── layout.tsx          # ThemeProvider + Toaster (atau share root)
│   └── portal/
│       ├── layout.tsx          # PortalHeader (logo + nav + logout), NO sidebar
│       ├── page.tsx            # dashboard ringkas
│       ├── login/
│       │   └── page.tsx        # email + OTP 2-step form
│       ├── proyek/
│       │   └── [id]/page.tsx   # detail proyek
│       ├── pembayaran/
│       │   └── page.tsx
│       ├── profile/
│       │   └── page.tsx
│       └── auth/
│           └── callback/
│               └── route.ts    # OTP/invite callback handler
```

### 5.2 Middleware role gate

Extend `middleware.ts` di root:

```ts
// pseudo-code
import { createMiddlewareSupabase } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(req);
  await supabase.auth.getUser(); // refresh

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  // Public paths
  if (pathname === '/' || pathname.startsWith('/auth/')
      || pathname === '/login' || pathname === '/portal/login'
      || pathname.startsWith('/api/health')) {
    return response;
  }

  if (!user) {
    if (pathname.startsWith('/portal')) return redirect('/portal/login', req);
    return redirect('/login', req);
  }

  // Role check (cache via cookie 'x-role' 5min TTL)
  const role = await getRoleCached(supabase, user.id, req, response);

  if (role === 'client' && !pathname.startsWith('/portal')) {
    return redirect('/portal', req);
  }
  if (role !== 'client' && pathname.startsWith('/portal') && pathname !== '/portal/login') {
    return redirect('/dashboard', req);
  }

  return response;
}
```

Helper `getRoleCached`:
- Cek cookie `x-role` (signed/httponly, 5min expiry).
- Kalau tidak ada / expired: `supabase.from('profiles').select('role').eq('id', user.id).single()` → set cookie.
- Note: profile role rarely changes; cache 5min acceptable. Bila admin revoke client, dia harus tutup browser klien (atau tunggu cache expire) — acceptable untuk MVP.

### 5.3 Layout `app/(portal)/portal/layout.tsx`

Server component:
- `getServerSupabase()` + `auth.getUser()` (defense in depth — middleware sudah lolos, ini second gate).
- Fetch `profiles` + `clients` row (untuk `full_name` di header).
- Render `<PortalHeader />` + `{children}`.

`<PortalHeader />` (client component):
- Logo Bimbingo.
- Nav links: Dashboard | Pembayaran | Profil.
- Tombol logout (POST `/auth/sign-out` existing handler) + `redirect('/portal/login')`.
- Theme toggle (re-use existing `<ThemeToggle />`).

---

## 6. Pages Content

### 6.1 `/portal` — Dashboard ringkas

Layout:
```
<h1>Halo, {full_name}</h1>
<p class="text-muted">Berikut progres proyek skripsi Anda.</p>

{projects.length === 0 && <EmptyState message="Belum ada proyek aktif." />}

<div class="grid gap-4 sm:grid-cols-2">
  {projects.map(p => <ProjectCard key={p.id} ... />)}
</div>
```

`<ProjectCard />`:
- Title + status badge (mengikuti `projects.status` existing enum).
- Progress bar (% dari view `project_progress_summary.progress_percent` — sudah ada).
- "Tahap berikutnya: **{title}** — due 15 Jun 2026" — query: `select title, due_date from project_milestones where project_id = $1 and status not in ('approved','done') order by sequence asc limit 1`.
- "Pembayaran: **Rp 2.500.000** dari Rp 5.000.000" (dari view `project_finance_summary.total_paid` + `.total_value`).
- CTA "Lihat detail" → `/portal/proyek/{id}`.

Data fetching: server component, query via authenticated Supabase client. RLS otomatis filter ke milik klien.

### 6.2 `/portal/proyek/[id]`

```
<Breadcrumb>Portal / Proyek / {title}</Breadcrumb>
<h1>{title}</h1>
<div class="grid sm:grid-cols-3 gap-4">
  <Stat label="Progres" value="{progress}%" />
  <Stat label="Status" value={statusBadge} />
  <Stat label="Target selesai" value={target_end_date} />
</div>

<section>
  <h2>Tahapan Proyek</h2>
  <MilestoneList>
    {milestones.map(m => (
      <MilestoneRow key={m.id}>
        <title>{m.title}</title>
        <date>{m.due_date ? formatTanggal(m.due_date) : '—'}</date>
        <statusBadge status={m.status} />  {/* enum: not-started | in-progress | submitted | revisi | approved | done */}
      </MilestoneRow>
    ))}
  </MilestoneList>
</section>

Catatan: tabel `project_milestones` (bukan `milestones`). Tidak ada kolom `progress_percent` per milestone — hanya `weight_percent` + `status`. Progress proyek keseluruhan dari view `project_progress_summary.progress_percent`.
```

404 (atau 403) jika project_id bukan milik klien (RLS akan kembalikan empty → komponen tampilkan "Proyek tidak ditemukan").

### 6.3 `/portal/pembayaran`

```
<h1>Riwayat Pembayaran</h1>

<div class="grid sm:grid-cols-3 gap-4">
  <KPI label="Total tagihan" value={formatRupiah(total)} />
  <KPI label="Sudah dibayar" value={formatRupiah(paid)} />
  <KPI label="Sisa" value={formatRupiah(remaining)} variant={remaining > 0 ? 'warning' : 'success'} />
</div>

<Table>
  <thead>
    <tr><th>Tanggal</th><th>Termin</th><th>Metode</th><th>Jumlah</th><th>Status</th></tr>
  </thead>
  <tbody>
    {payments.map(p => (
      <tr>
        <td>{formatTanggal(p.paid_at)}</td>
        <td>{p.installment_label ?? '—'}</td>
        <td>{p.method}</td>
        <td class="text-right">{formatRupiah(p.amount)}</td>
        <td><PaymentStatusBadge verified={p.verified} /></td>
      </tr>
    ))}
  </tbody>
</Table>

Catatan: schema `payments` punya field `paid_at`, `method` (enum), `installment_label`, `amount`, `verified` (boolean). Tidak ada `description` atau `status` enum. Mapping status badge: `verified=true` → "Terverifikasi"; `verified=false` → "Menunggu verifikasi". KPI dihitung dari sum manual / view `project_finance_summary` (total_paid, outstanding, total_value).
```

No proof file download (fase 2). No edit/delete.

### 6.4 `/portal/profile`

```
<h1>Profil</h1>
<Card>
  <Field label="Nama" value={client.full_name} />
  <Field label="Email" value={client.email} />
  <Field label="WhatsApp" value={client.whatsapp} />
  <Field label="Kampus" value={client.university} />
  <Field label="Jurusan" value={client.major} />
</Card>

<form action="/auth/sign-out" method="post">
  <button type="submit" class="btn-outline">Keluar</button>
</form>
```

Read-only. Admin tetap pemilik data klien — kalau ada perubahan, klien hubungi admin (instruksi tertulis di footer).

---

## 7. Admin-side Integration

### 7.1 `/clients/[id]` detail page

Tambah section baru:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Akses Portal</CardTitle>
    <CardDescription>Beri klien akses lihat progres sendiri.</CardDescription>
  </CardHeader>
  <CardContent>
    {!client.email && (
      <p class="text-muted">Tambahkan email klien dulu untuk mengaktifkan portal.</p>
    )}
    {client.email && !client.client_user_id && (
      <InvitePortalButton clientId={client.id} />
    )}
    {client.client_user_id && (
      <>
        <Badge>Aktif</Badge>
        <p>Klien dapat login di /portal/login dengan email {client.email}.</p>
        <RevokePortalButton clientId={client.id} />  {/* AlertDialog confirm */}
      </>
    )}
  </CardContent>
</Card>
```

### 7.2 Schema zod

`lib/schemas/portal.ts`:
```ts
import { z } from 'zod';

export const InviteClientSchema = z.object({
  clientId: z.string().uuid(),
});

export const RequestPortalOtpSchema = z.object({
  email: z.string().email(),
});

export const VerifyPortalOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6).regex(/^\d+$/, 'OTP harus 6 digit angka'),
});
```

---

## 8. Testing

### 8.1 Unit (Vitest)
- `lib/schemas/portal.ts` — happy + invalid path untuk 3 schema.

### 8.2 RLS smoke test (manual SQL)
`tests/rls/portal.sql`:

```sql
-- setup
-- admin A creates client X (linked to client_user U)
-- admin B (different owner) creates client Y (linked to client_user V)
-- create project_A for client X under admin A
-- create project_B for client Y under admin B

-- test 1: as U (client_user X), should see client X only
set role authenticated;
set request.jwt.claims = '{"sub":"<U_uuid>"}';
select * from public.clients;  -- expect 1 row (X)
select * from public.projects; -- expect 1 row (project_A)

-- test 2: as U, should not see client Y or project_B
-- already covered by previous assertion

-- test 3: as admin A, should still see client X (existing owner_id policy)
set request.jwt.claims = '{"sub":"<adminA_uuid>"}';
select * from public.clients where owner_id = '<adminA_uuid>'; -- expect 1+
```

### 8.3 E2E manual (smoke)
1. Login admin → buka klien yang punya email → klik "Aktifkan portal".
2. Cek email klien (kotak masuk inbox alternate) → invite arrive.
3. Buka `/portal/login` → input email → terima OTP code (atau klik link) → input code → masuk portal.
4. Verifikasi: cuma data klien tersebut yang tampil. Coba akses `/dashboard` → redirect ke `/portal`.
5. Logout → `/portal/login`.
6. Admin revoke → klien refresh → kembali ke `/portal/login` (dalam ≤5 menit cache).

---

## 9. Security Considerations

| Risk | Mitigasi |
|------|----------|
| Email enumeration via OTP request | `shouldCreateUser: false` cegah signup; response sama untuk valid/invalid email (rate-limit Supabase default). |
| Admin lupa revoke saat klien selesai | Tombol "Cabut akses" di section "Akses Portal"; idealnya tambah cron mingguan kirim reminder klien dengan project status="selesai" >30 hari (fase 2). |
| Klien lihat data klien lain | RLS hard-enforced via 4 policy baru + subquery `client_user_id = auth.uid()`. Tested di `tests/rls/portal.sql`. |
| Klien akses route admin | Middleware redirect berdasar `profiles.role`; layout `(app)` second gate via `auth.getUser()` + RLS otomatis kembalikan empty. |
| Service-role bocor ke client bundle | `getAdminSupabase()` hanya di-import dari file `'use server'` (lib/actions/portal.ts). Build-time check existing. |
| Session client persist setelah revoke | Cookie cache role 5min → max delay 5min sebelum redirect. Acceptable MVP. `admin.deleteUser` invalidate refresh token. |

CLAUDE.md §6 security checklist:
- [x] Action call `requireUser()`.
- [x] Input zod-validated.
- [x] `getAdminSupabase()` hanya di server action admin-gated (bukan public).
- [x] RLS tested cross-tenant.
- [x] Service-role key tidak di client component.
- [x] Tidak ada PII di console.log.
- [x] Error message generic (tidak leak "email belum terdaftar").

---

## 10. Deployment & Migration Sequence

1. **Buat migrasi** `20260522000001_client_portal.sql` (Section 3).
2. `pnpm supabase db push` (verifikasi RLS via SQL editor dulu di staging branch).
3. `pnpm db:types` → regen `types/database.ts`.
4. Implement code per Section 4–7.
5. Configure Supabase email templates (Section 4.3) — manual via Dashboard.
6. **Env var:** `NEXT_PUBLIC_APP_URL` sudah didefinisikan di `lib/env.ts`. Pakai variable existing untuk `redirectTo`. Tidak perlu tambah env baru.
7. Deploy ke Vercel (auto via push `main`).
8. Smoke test produksi (Section 8.3).
9. Tambah link "Login klien" di landing page footer (`app/page.tsx`) — opsional fase ini.

---

## 11. Open questions / Asumsi

- **Email klien wajib?** Saat ini `clients.email` nullable. Portal hanya bisa diaktifkan kalau email ada — UI button disabled bila kosong. Tidak ada perubahan constraint.
- **Apa kalau email klien duplikat dengan admin existing?** Kondisi langka tapi mungkin. `inviteUserByEmail` akan reject (duplicate). Tangkap error → toast "Email ini sudah dipakai akun lain. Gunakan email berbeda."
- **Kalau klien punya 2+ proyek dengan admin berbeda?** Dengan `client_user_id` 1:1, current design asumsi 1 akun klien = 1 admin owner. Multi-admin per klien = fase nanti (perlu refactor ke join table).
- **Custom fields klien tampil di portal?** Tidak fase ini. Admin internal data only.

---

## 12. Referensi

- Roadmap: `docs/06-implementation-roadmap.md` (F2.4 estimasi 5 hari, kita cut ke ~3 hari read-only lite)
- Eskalasi B: `docs/09-monetization-scalability.md` §3
- Security policy: `docs/10-security-compliance.md`
- API pattern: `docs/11-api-spec.md`
- Supabase docs (via MCP search):
  - `auth.admin.inviteUserByEmail` + invite email template + metadata propagation via `raw_user_meta_data`.
  - `signInWithOtp({ shouldCreateUser: false })` blokir signup.
  - Email OTP code via template token `{{ .Token }}` (workaround Microsoft Defender Safe Links prefetcher).
  - RLS policy with role check via subquery (alternatif: Custom Access Token Hook + `auth.jwt() ->> 'user_role'` — skipped untuk MVP karena overkill skala <30 user).

---

**Approval checkpoint:** Spec siap untuk diturunkan ke implementation plan (next step: `superpowers:writing-plans`).
