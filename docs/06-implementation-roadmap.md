# Implementation Roadmap — Joki Portal

> **Untuk engineer yang akan eksekusi:** Setiap minggu dipecah ke task harian dengan deliverable jelas + commit boundary. Bekerja dengan disiplin TDD ringan: tulis test untuk validasi & server action bisnis, smoke-test e2e untuk happy path.

**Durasi total MVP:** 4.5 minggu (~ 22 hari kerja efektif) — termasuk modul Custom Fields (M11).
**Hari kerja per minggu:** 5.
**Beban harian:** ~ 4–6 jam fokus.

---

## Ringkasan Milestone

| Minggu | Fokus | Output Akhir |
|--------|-------|--------------|
| 1 | Bootstrap repo + DB + Auth + App Shell | Bisa login, sidebar tampil, RLS aktif |
| 2 | CRUD Klien, Dosen, Proyek + Milestones | Bisa input semua data domain |
| 3 | Kanban + Task + Files + **Custom Fields** | Workflow inti + extensibility jalan |
| 4 | Finance + Dashboard + Polish + Deploy | Sistem lengkap di produksi |
| 4.5 | Buffer + integrasi custom fields lintas entitas | Custom fields rapi di semua entity |

---

## Minggu 1 — Bootstrap & Foundation

### Hari 1 — Repo + Supabase project
- [ ] Buat repo GitHub privat `joki-portal`.
- [ ] `pnpm create next-app@latest joki-portal --typescript --tailwind --app --eslint --src-dir=false`.
- [ ] Install dependencies dasar (lihat `03-tech-stack-architecture.md` section 8).
- [ ] Setup Prettier + `prettier-plugin-tailwindcss`.
- [ ] Buat project Supabase region `ap-southeast-1`, simpan URL + anon key + service role key.
- [ ] Buat `.env.local` + `.env.example` (placeholders saja).
- [ ] Inisialisasi `git`, push initial commit.

**Commit:** `chore: bootstrap next.js + supabase project`

### Hari 2 — Schema & RLS
- [ ] Install Supabase CLI: `pnpm add -D supabase`.
- [ ] `pnpm supabase init`.
- [ ] Buat migrasi pertama dengan seluruh DDL dari `02-database-schema.md` section 3.
- [ ] Tambah triggers & functions (section 6).
- [ ] Apply RLS policies (section 5).
- [ ] Push ke Supabase: `pnpm supabase db push`.
- [ ] Generate types: `pnpm supabase gen types typescript --linked > types/database.ts`.
- [ ] Smoke test RLS via SQL editor dengan 2 user dummy.

**Commit:** `feat(db): initial schema + RLS policies`

### Hari 3 — Supabase clients + Auth shell
- [ ] Buat `lib/supabase/{server,client,admin,middleware}.ts` (lihat `03-tech-stack-architecture.md` section 5).
- [ ] Buat `middleware.ts` di root untuk refresh session.
- [ ] Halaman `/login` dengan form email/password + magic link.
- [ ] Halaman `/(auth)/callback` route untuk redirect setelah magic link.
- [ ] Halaman dashboard `/` placeholder (sebut user email).
- [ ] Test: signup user dummy via Supabase dashboard → coba login → coba akses `/` tanpa session.

**Commit:** `feat(auth): login + magic link + protected dashboard`

### Hari 4 — App Shell (sidebar + topbar)
- [ ] Install shadcn: `pnpm dlx shadcn@latest init`.
- [ ] `pnpm dlx shadcn@latest add button card input label textarea select dropdown-menu dialog sheet tabs badge avatar tooltip toast skeleton separator alert alert-dialog popover command table breadcrumb calendar`.
- [ ] Buat `components/shared/Sidebar.tsx` + `Topbar.tsx`.
- [ ] Buat layout `app/(dashboard)/layout.tsx` dengan grid sidebar + main.
- [ ] Mobile: sidebar collapse ke sheet.
- [ ] Logout button.

**Commit:** `feat(ui): app shell with sidebar and topbar`

### Hari 5 — Tipografi, tema, polish
- [ ] Setup font Inter + JetBrains Mono via `next/font/google`.
- [ ] Apply token color OKLCH ke `globals.css` (lihat `05-ui-ux-design.md`).
- [ ] Toggle dark mode (system preference + manual).
- [ ] Buat helper `lib/format.ts` (`formatRupiah`, `formatTanggal`).
- [ ] Buat `components/shared/EmptyState.tsx` reusable.
- [ ] Smoke test: lighthouse mobile ≥ 90 untuk halaman login.

**Commit:** `chore(ui): typography, theme tokens, format helpers`

**End-of-week deliverable:** ✅ Login & shell siap. Push ke Vercel preview.

---

## Minggu 2 — Manajemen Klien, Dosen, Proyek

### Hari 6 — Server actions skeleton
- [ ] Buat folder `lib/actions/` dan file `clients.ts`, `lecturers.ts`, `projects.ts`, `tasks.ts`, `payments.ts`, `files.ts`.
- [ ] Define zod schemas di `lib/schemas/*.ts` (mirror DB constraints).
- [ ] Implementasi `createClient`, `updateClient`, `archiveClient`, `restoreClient`.
- [ ] Unit test zod schemas dengan Vitest.

**Commit:** `feat(actions): client CRUD server actions + zod schemas`

### Hari 7 — Halaman list & detail klien
- [ ] `app/(dashboard)/clients/page.tsx` — tabel TanStack Table dengan search & filter.
- [ ] `app/(dashboard)/clients/new/page.tsx` — form react-hook-form.
- [ ] `app/(dashboard)/clients/[id]/page.tsx` — detail + tabs.
- [ ] `app/(dashboard)/clients/[id]/edit/page.tsx`.
- [ ] Test e2e: tambah klien → muncul di list → klik detail → edit → arsipkan.

**Commit:** `feat(clients): CRUD pages with search & filter`

### Hari 8 — Dosen pembimbing
- [ ] Server actions `lecturers.ts`.
- [ ] Halaman list & detail dosen (mirip klien tapi sederhana).
- [ ] Combobox "Pilih dosen" reusable component (searchable + create-inline).
- [ ] Integrasikan ke form klien (pembimbing 1 & 2).

**Commit:** `feat(lecturers): CRUD + searchable combobox`

### Hari 9 — Proyek skripsi
- [ ] Server actions `projects.ts` (`createProject`, `updateProject`, `changeStatus`, `archive`).
- [ ] Saat create project: transactional insert milestones default (Bab 1-5 + Sidang) menggunakan Postgres function atau multi-insert.
- [ ] Halaman `/projects/page.tsx` (list semua proyek).
- [ ] `/projects/new/page.tsx` (pilih klien → form).
- [ ] `/projects/[id]/page.tsx` (detail + tabs Overview/Board/Timeline/Files/Finance).
- [ ] Progress bar pakai view `project_progress_summary`.

**Commit:** `feat(projects): CRUD + auto-generate milestones`

### Hari 10 — Milestones editor + project_lecturers
- [ ] Modal edit milestones (list editable, drag reorder).
- [ ] Validasi: weight_percent total ≤ 100.
- [ ] Form attach dosen pembimbing/penguji (multiselect role).
- [ ] E2E test: bikin proyek baru lengkap.

**Commit:** `feat(milestones): editor + lecturer assignments`

**End-of-week deliverable:** ✅ Bisa input semua data master.

---

## Minggu 3 — Kanban, Task, Files

### Hari 11 — Server actions tasks
- [ ] `createTask`, `updateTask`, `updateTaskStatus`, `reorderTask`, `deleteTask`.
- [ ] `addTaskComment`.
- [ ] Test: order_index fractional (insert antara 2 task tanpa rewrite seluruh kolom).

**Commit:** `feat(tasks): server actions + fractional ordering`

### Hari 12 — Kanban Board
- [ ] Install `@dnd-kit/core` + `@dnd-kit/sortable`.
- [ ] `components/board/KanbanBoard.tsx` (5 kolom).
- [ ] `KanbanColumn`, `TaskCard`.
- [ ] Drag-drop dengan optimistic update via TanStack Query.
- [ ] Mobile fallback: list view dengan dropdown ubah status.

**Commit:** `feat(board): kanban with drag-drop`

### Hari 13 — Detail task & comments
- [ ] `TaskDetailSheet.tsx` — sheet shadcn yang slide dari kanan.
- [ ] Form edit task in-place.
- [ ] List komentar + form tambah komentar.
- [ ] Tombol hapus task dengan AlertDialog.

**Commit:** `feat(task-detail): edit + comments`

### Hari 14 — File upload + storage
- [ ] Buat bucket `project-files` di Supabase (private).
- [ ] Storage policies (lihat `02-database-schema.md` section 5.3).
- [ ] Server action `getSignedUploadUrl(projectId, taskId?, filename, contentType)`.
- [ ] `FileUploader.tsx` (drag-drop area) + progress bar.
- [ ] Server action `recordFileMetadata` setelah upload sukses.
- [ ] `FileList.tsx` di tab Files proyek.
- [ ] Server action `getSignedDownloadUrl` + delete.

**Commit:** `feat(files): upload, list, download via signed urls`

### Hari 14.5 — Custom Fields: schema + actions
- [ ] Migrasi `0002_custom_fields.sql`: tabel `custom_fields` + kolom `custom_data jsonb` di 5 entitas (lihat `12-custom-fields-extensibility.md` section 7).
- [ ] Server actions `lib/actions/custom_fields.ts`: `list/create/update/archive/restore/reorder`.
- [ ] Helper `lib/customFields/validate.ts` (dynamic zod builder).
- [ ] Wire ke `createClient`/`updateClient` sebagai showcase pertama.

**Commit:** `feat(custom-fields): schema + server actions + dynamic validator`

### Hari 14.75 — Custom Fields: UI components
- [ ] `components/custom-fields/CustomFieldInput.tsx` (dynamic switcher).
- [ ] `components/custom-fields/CustomFieldCell.tsx` (table cell renderer).
- [ ] `components/custom-fields/OptionsEditor.tsx` (untuk select/multiselect).
- [ ] `components/custom-fields/FieldEditor.tsx` (modal tambah/edit field).
- [ ] `components/custom-fields/ColumnManager.tsx` (modal kelola kolom).
- [ ] Integrasi ke list view klien + form CRUD klien.

**Commit:** `feat(custom-fields): column manager + dynamic inputs`

### Hari 15 — Realtime sync + buffer
- [ ] Supabase Realtime channel per project_id untuk tasks.
- [ ] Hook `useRealtimeTasks(projectId)` di Board.
- [ ] Conflict resolution: server-side update menang.
- [ ] Polish loading & error states board.

**Commit:** `feat(realtime): live kanban sync across tabs`

**End-of-week deliverable:** ✅ Workflow pengerjaan bab end-to-end jalan.

---

## Minggu 4 — Finance, Dashboard, Polish & Deploy

### Hari 16 — Server actions payments
- [ ] `recordPayment`, `updatePayment`, `deletePayment`, `verifyPayment`.
- [ ] View `project_finance_summary` dipakai di RSC.
- [ ] Form pencatatan pembayaran + upload bukti (link ke `files`).

**Commit:** `feat(payments): CRUD + linked proof file`

### Hari 17 — Tab Finance per proyek + Halaman global
- [ ] `/projects/[id]/finance` — tabel + card ringkasan.
- [ ] `/finance` — global dengan date-range picker, KPI cards, chart bar + pie (Recharts).
- [ ] Export CSV button.

**Commit:** `feat(finance): per-project + global finance pages`

### Hari 18 — Dashboard utama
- [ ] KPI cards 4 metrik.
- [ ] Section "Deadline Mendekat" (Suspense).
- [ ] Section "Proyek Butuh Perhatian".
- [ ] Chart pendapatan 6 bulan.
- [ ] Quick actions menu.

**Commit:** `feat(dashboard): kpi cards + lists + revenue chart`

### Hari 19 — Polish UX, error/empty/loading states
- [ ] Audit semua halaman: skeleton untuk loading, EmptyState untuk no-data.
- [ ] Error boundary per route segment.
- [ ] Toast feedback di semua aksi destruktif & berhasil.
- [ ] Audit mobile responsiveness (Chrome DevTools).
- [ ] Lighthouse mobile semua halaman ≥ 85.

**Commit:** `polish: empty/loading/error states + mobile review`

### Hari 20 — Deploy & smoke test produksi
- [ ] Setup Vercel project, hubungkan GitHub.
- [ ] Set env vars di Vercel (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY).
- [ ] Buat `vercel.ts` (lihat `08-deployment-devops.md`).
- [ ] Push `main` → Vercel deploy production.
- [ ] Smoke test produksi: login, tambah klien, tambah proyek, kanban, upload file, pembayaran.
- [ ] Update README dengan URL production.

**Commit:** `chore: production deploy`

**End-of-week deliverable:** ✅ Sistem lengkap di produksi (URL Vercel) + 2-3 klien data riil sudah diisi.

---

## Setelah MVP — Backlog Fase 2 (referensi)

Tidak masuk timeline 4 minggu, tapi diprioritaskan untuk dikerjakan setelah MVP stabil:

| # | Fitur | Estimasi |
|---|-------|----------|
| F2.1 | Notifikasi in-app + reminder deadline (cron Vercel) | 3 hari |
| F2.2 | Audit log UI | 2 hari |
| F2.3 | Cmd-K global search | 2 hari |
| F2.4 | Client portal (login klien) | 5 hari |
| F2.5 | Payment gateway Midtrans QRIS | 4 hari |
| F2.6 | Integrasi Fonnte WhatsApp | 3 hari |
| F2.7 | Multi-admin / multi-tenant | 5 hari |
| F2.8 | PDF invoice generator | 2 hari |

Detail strategi eskalasi di [`09-monetization-scalability.md`](./09-monetization-scalability.md).

---

## Testing Strategy

### Unit (Vitest)
- Semua zod schemas (validasi happy + error path).
- Helper `formatRupiah`, `formatTanggal`.
- Logika order_index fractional untuk task reorder.

### Integration
- Server actions dipanggil dengan input valid → DB state sesuai.
- RLS: 2 user dummy, user A tidak bisa read/write data user B (script SQL di `tests/rls/`).

### E2E (Playwright)
Cover happy path utama:
1. Login → dashboard.
2. Tambah klien → ada di list.
3. Buat proyek + milestones default.
4. Drag task di kanban → status berubah.
5. Upload file draf → muncul di list → download.
6. Catat pembayaran → ringkasan terupdate.

Target: 6 e2e test di MVP, dijalankan di GitHub Actions setiap PR.

---

## Definition of Done per Task

Sebelum task ditandai selesai:
1. Code di-format Prettier + lulus ESLint.
2. Type-check `tsc --noEmit` lulus.
3. Test unit/integration relevan ditulis & lulus.
4. Manual test di desktop + Chrome DevTools mobile mode.
5. Tidak ada `console.log`, `TODO` tanpa issue link, atau dead code.
6. Commit pesan ikuti Conventional Commits.

---

## Risiko Timeline & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Hari 12 (Kanban) lebih lama | Fallback: list view dengan dropdown status (drop drag-drop). Drag-drop dipindah ke fase 2. |
| Realtime sulit di-debug | Skip realtime di MVP; cukup `router.refresh()` di action. |
| Lighthouse < 85 di mobile | Audit RSC vs Client Component split; defer chart load via Suspense. |
| Supabase free tier limit | Monitor di dashboard mingguan; upgrade Pro ($25/bln) jika klien > 30. |
