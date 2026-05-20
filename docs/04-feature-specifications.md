# Spesifikasi Fitur — Bimbingo

Setiap fitur ditulis dengan format:
- **Tujuan**
- **User Story**
- **Acceptance Criteria** (AC, dapat di-test)
- **Komponen & Halaman terkait**
- **Edge case**

---

## M1 — Auth & Profil

### M1.1 Login
**Tujuan:** Hanya admin terdaftar yang dapat mengakses sistem.

**User Story:**
> Sebagai admin, saya ingin login dengan email & password ATAU magic link, supaya saya bisa masuk dari device yang berbeda tanpa hafal password.

**AC:**
- [AC-1.1] Halaman `/login` menampilkan form email + password.
- [AC-1.2] Opsi "Kirim magic link" mengirimkan email berisi link login dari Supabase.
- [AC-1.3] Setelah login berhasil → redirect ke `/` (dashboard).
- [AC-1.4] Pesan error spesifik tapi tidak bocorkan info: "Email atau password salah".
- [AC-1.5] Setelah 5 percobaan gagal dalam 15 menit → blokir IP 15 menit (Supabase built-in rate limit).
- [AC-1.6] Session disimpan di httpOnly cookie, expire 7 hari, refresh otomatis.
- [AC-1.7] Logout menghapus session di server + browser.

**Halaman/Component:**
- `app/(auth)/login/page.tsx`
- `components/forms/LoginForm.tsx`
- `app/(auth)/callback/route.ts` (untuk magic link redirect)

**Edge case:**
- Magic link kadaluarsa (> 1 jam) → tampilkan "Link sudah kadaluarsa, minta link baru".
- Klik login saat sudah login → redirect ke dashboard.

### M1.2 Profil Admin
**AC:**
- [AC-1.8] Halaman `/settings/profile` menampilkan: nama lengkap, avatar URL, nomor HP, timezone.
- [AC-1.9] Avatar upload via Supabase Storage bucket `avatars`.
- [AC-1.10] Update password (input password lama → password baru → konfirmasi).

---

## M2 — Manajemen Klien

### M2.1 Daftar Klien
**Tujuan:** Lihat semua klien dalam satu tabel dengan filter cepat.

**AC:**
- [AC-2.1] Tabel menampilkan kolom: Nama, WA, Kampus, Jurusan, Target Sidang, Status Proyek Aktif, Aksi.
- [AC-2.2] Default sort: `target_defense ASC` (terdekat di atas).
- [AC-2.3] Search box realtime (debounced 300ms): cocok di field nama, WA, kampus.
- [AC-2.4] Filter: status (aktif/arsip), kampus (dropdown distinct).
- [AC-2.5] Pagination: 20 baris per halaman.
- [AC-2.6] Klik row → ke `/clients/[id]`.
- [AC-2.7] Tombol "+ Tambah Klien" di kanan atas.

**Component:**
- `app/(dashboard)/clients/page.tsx`
- `components/clients/ClientsTable.tsx` (TanStack Table)

### M2.2 Tambah / Edit Klien
**AC:**
- [AC-2.8] Form field: full_name (wajib), nickname, whatsapp (wajib, format `+62...` atau `08...`), email, university, faculty, major, student_id, semester (1–20), target_defense, source, notes.
- [AC-2.9] Validasi via zod, error muncul inline.
- [AC-2.10] Submit sukses → redirect ke detail klien + toast "Klien berhasil disimpan".
- [AC-2.11] Mode edit: load data existing, submit jalankan UPDATE.

### M2.3 Detail Klien
**AC:**
- [AC-2.12] Halaman menampilkan: info pribadi, daftar proyek skripsi (card per proyek), timeline `client_notes`.
- [AC-2.13] Tombol "Buat Proyek Baru" jika belum ada / mau tambah.
- [AC-2.14] Tab atau accordion: "Catatan", "Dokumen", "Riwayat Pembayaran".
- [AC-2.15] Tombol arsip / unarchive klien (soft delete via `archived_at`).

### M2.4 Catatan Karakteristik Dosbing (terintegrasi M2)
**Tujuan:** Profiling dosbing supaya pengerjaan menyesuaikan gaya revisi.

**AC:**
- [AC-2.16] Form klien punya picker "Dosen Pembimbing 1/2" (dropdown searchable dari tabel `lecturers`, dengan opsi "+ tambah dosen baru" inline).
- [AC-2.17] Halaman detail dosen `/lecturers/[id]` menampilkan: nama, gelar, kampus, characteristics (textarea), tags (chip).
- [AC-2.18] Dari detail klien, klik nama dosbing → ke detail dosen.

---

## M3 — Manajemen Proyek Skripsi

### M3.1 Buat Proyek
**AC:**
- [AC-3.1] Form: title, type (default `skripsi`), description, total_value (Rp, input dengan thousand separator), start_date, target_end_date.
- [AC-3.2] Saat buat proyek, sistem menawarkan "Generate milestone default": Bab 1 s/d Bab 5 + Sidang, dengan weight_percent default `[10,20,25,25,15,5]`.
- [AC-3.3] User bisa skip generate atau ubah angka & nama bab sebelum submit.
- [AC-3.4] Submit → buat record `projects` + N record `project_milestones` dalam 1 transaksi.

### M3.2 Detail Proyek (Overview)
**AC:**
- [AC-3.5] Header: judul, klien (link), status (badge), progress bar (dari `project_progress_summary`).
- [AC-3.6] Quick stats: Total Nilai, Sudah Dibayar, Sisa, Hari Tersisa ke Target.
- [AC-3.7] Tab navigasi: Overview / Board / Timeline / Files / Finance.
- [AC-3.8] Aksi: edit, ubah status proyek (active/on-hold/completed/cancelled), arsip.

### M3.3 Edit Milestone
**AC:**
- [AC-3.9] Halaman/modal edit list milestone: ubah title, due_date, weight_percent, status.
- [AC-3.10] Validasi: total weight_percent <= 100, sequence unik.
- [AC-3.11] Bisa tambah milestone custom (mis. "Revisi Bab 4 setelah sidang proposal").

---

## M4 — Kanban & Task

### M4.1 Board Kanban
**Tujuan:** Lihat semua task per proyek dalam kolom-kolom status.

**AC:**
- [AC-4.1] 5 kolom: **Backlog**, **In Progress**, **Review Dosen**, **Revisi**, **Done**.
- [AC-4.2] Setiap task ditampilkan sebagai card: title, badge prioritas, due date (highlight merah jika < H-3 dan belum done), milestone parent (chip).
- [AC-4.3] Drag-drop antar kolom (dnd-kit) → trigger Server Action `updateTaskStatus`.
- [AC-4.4] Drop di kolom **Done** → `completed_at = now()` + reorder.
- [AC-4.5] Reorder dalam kolom yang sama → update `order_index` (fractional).
- [AC-4.6] Realtime sync antar tab via Supabase Realtime (channel per project_id).
- [AC-4.7] Mobile (< 640px): tampilan jadi single-column dengan dropdown filter status (toggle ke list view).

### M4.2 Detail Task
**AC:**
- [AC-4.8] Klik card → dialog/sheet detail: edit title, description, due_date, priority, milestone, status.
- [AC-4.9] Section komentar/catatan revisi: list `task_comments` reverse-chrono, input textarea + tombol "Tambah Catatan".
- [AC-4.10] Lampiran file: tampilkan file yang `task_id = task.id`, tombol upload.

### M4.3 Buat / Hapus Task
**AC:**
- [AC-4.11] Tombol "+ Task" di tiap kolom Kanban → form ringkas inline (judul + due date).
- [AC-4.12] Tombol "Hapus" di detail task → konfirmasi → hard delete (task biasanya tidak audit-critical).

### M4.4 Toggle List view vs Board view
**AC:**
- [AC-4.13] Default = list view (lebih ringan di mobile). Toggle ke Board view tersedia di topbar.
- [AC-4.14] List view = tabel: title, status, priority, due, assignee, milestone, aksi.
- [AC-4.15] **List view extensible** — admin dapat menambah/menyembunyikan/mereorder kolom (termasuk custom field). Pilihan kolom tersimpan per user di localStorage. Detail: lihat M11 dan [`12-custom-fields-extensibility.md`](./12-custom-fields-extensibility.md).
- [AC-4.16] Filter dan sort tersedia untuk kolom bawaan maupun custom field bertipe sortable.
- [AC-4.17] Toggle view tersedia di entitas yang mendukung (klien, proyek, task, pembayaran, dosen) — minimum list view + (untuk task) board view.

---

## M5 — Pencatatan Pembayaran

### M5.1 Catat Pembayaran
**AC:**
- [AC-5.1] Dari tab "Finance" proyek → tombol "Catat Pembayaran".
- [AC-5.2] Form: amount (Rp), paid_at (default today), method, reference, installment_label (dropdown bebas/preset), proof file (upload), notes, verified (checkbox).
- [AC-5.3] Submit → insert ke `payments` + (jika ada bukti) insert ke `files` + link `proof_file_id`.
- [AC-5.4] Tampilkan toast "Pembayaran tercatat. Sisa tagihan: Rp ...".

### M5.2 Tabel & Ringkasan Pembayaran
**AC:**
- [AC-5.5] Tabel: tanggal, amount, method, label, verified, bukti (link), aksi (edit/hapus).
- [AC-5.6] Card ringkasan di atas tabel: Total Kontrak, Total Dibayar, Sisa, % Terbayar (progress bar).
- [AC-5.7] Edit/hapus pembayaran → audit log mencatat perubahan.

### M5.3 Halaman Finance Global `/finance`
**AC:**
- [AC-5.8] Lihat **semua** pembayaran lintas proyek.
- [AC-5.9] Filter rentang tanggal (default bulan ini).
- [AC-5.10] Chart bar: pemasukan per bulan (12 bulan terakhir).
- [AC-5.11] Chart pie: pemasukan per metode (transfer/QRIS/dll).
- [AC-5.12] KPI cards: Pendapatan Bulan Ini, Pendapatan YTD, Total Piutang Aktif.
- [AC-5.13] Export CSV: download semua transaksi yang ter-filter.

---

## M6 — File & Asset

### M6.1 Upload File
**AC:**
- [AC-6.1] Tombol upload di: detail proyek (tab Files), detail task (modal), form pembayaran (bukti).
- [AC-6.2] Tipe yang diizinkan: pdf, doc, docx, jpg, png, webp, zip. Max 25 MB per file (limit free tier).
- [AC-6.3] Upload menggunakan signed URL → langsung ke Supabase Storage.
- [AC-6.4] Setelah upload sukses → record `files` dibuat dengan metadata (project_id, task_id, category).
- [AC-6.5] Progress bar di UI selama upload.

### M6.2 List & Download File
**AC:**
- [AC-6.6] Tab Files: tabel filename, kategori, size, tanggal upload, aksi (download/hapus).
- [AC-6.7] Filter kategori: draft / referensi / bukti-bayar / administrasi / final / lainnya.
- [AC-6.8] Download via signed URL (expire 1 jam).
- [AC-6.9] Hapus → konfirmasi → hapus blob + record DB.

### M6.3 Preview
**AC:**
- [AC-6.10] PDF & gambar bisa di-preview inline (modal / new tab).
- [AC-6.11] File lain hanya download.

---

## M7 — Dashboard

### M7.1 Komponen Dashboard
**AC:**
- [AC-7.1] KPI cards (4 kartu):
  - Klien Aktif: count clients tanpa archived & punya project active
  - Proyek Aktif: count projects status active
  - Pendapatan Bulan Ini: sum payments bulan ini
  - Total Piutang: sum outstanding semua proyek active
- [AC-7.2] Section **Deadline Mendekat**: list 5 task dengan `due_date` ≤ 7 hari, status bukan done, sortir asc.
- [AC-7.3] Section **Proyek Butuh Perhatian**: proyek yang updated_at > 5 hari yang lalu & status active.
- [AC-7.4] Chart pendapatan 6 bulan terakhir (bar).
- [AC-7.5] Quick actions: "+ Klien Baru", "+ Catat Pembayaran", "+ Task Cepat".

### M7.2 Performa Dashboard
**AC:**
- [AC-7.6] Setiap section pakai Suspense, stream paralel (tidak menunggu satu sama lain).
- [AC-7.7] Data dari view `project_finance_summary` dan `project_progress_summary` (single query, tanpa N+1).

---

## M8 — Pencarian Global & Filter (P1)

**AC:**
- [AC-8.1] Topbar punya search box (Cmd/Ctrl+K) → command palette.
- [AC-8.2] Hasil cari mencakup: klien (nama/WA), proyek (judul), task (judul), dosen (nama).
- [AC-8.3] Highlight match, navigate ke entity.
- [AC-8.4] Query backend pakai `ilike` + index (atau Postgres FTS bila volume besar).

---

## M9 — Notifikasi In-app (P1)

**AC:**
- [AC-9.1] Cron Vercel harian (07:00 WIB) cek task dengan `due_date` = H+3 atau H+7 → insert ke tabel `notifications` (didefinisikan di fase implementasi P1).
- [AC-9.2] Topbar bell icon dengan badge count.
- [AC-9.3] Dropdown list notif, klik → ke entity terkait.
- [AC-9.4] Mark all as read.
- [AC-9.5] Browser Push (opsional, opt-in di settings) — fase 2.

---

## M11 — Custom Fields (Extensibility) — P0

**Tujuan:** Admin dapat menambah kolom data baru pada entity klien / proyek / task / pembayaran / dosen tanpa migrasi schema.

> Spek lengkap di [`12-custom-fields-extensibility.md`](./12-custom-fields-extensibility.md). Ringkasan AC di sini:

**AC (ringkasan):**
- [AC-CF.1] Tombol "Kelola Kolom" tersedia di list view tiap entitas.
- [AC-CF.2] Mendukung tipe field: text, long_text, number, currency, percent, date, datetime, boolean, select, multiselect, user_ref, url, email, phone.
- [AC-CF.3] Custom field tampil di form CRUD, list view (sebagai kolom), kanban card (opsional), dan detail entity.
- [AC-CF.4] Validasi server-side via dynamic zod schema dari definisi field.
- [AC-CF.5] Soft delete field (arsip) tidak menghilangkan data di `custom_data` JSONB.

Lihat detail acceptance criteria CF.1–CF.12 di doc 12.

---

## M10 — Audit Log (P2)

**AC:**
- [AC-10.1] Halaman `/settings/audit-log` hanya untuk admin.
- [AC-10.2] Tabel: timestamp, actor, entity_type, entity_id (link), action, diff (collapsible JSON).
- [AC-10.3] Filter: entity_type, rentang tanggal, action.

---

## Acceptance Criteria Summary

Total **80+ AC** terdistribusi di 10 modul. Mapping ke test plan ada di [`06-implementation-roadmap.md`](./06-implementation-roadmap.md).

Setiap PR yang menyelesaikan AC harus:
1. Mencantumkan ID AC (mis. `Closes [AC-2.7]`).
2. Punya test (unit/integration/e2e sesuai context).
3. Manual test pada device mobile (Chrome DevTools mobile mode minimal).
