# PRD — Joki Portal

**Versi:** 1.0
**Tanggal:** 2026-05-20
**Status:** Draft → Approved untuk implementasi MVP

---

## 1. Latar Belakang & Masalah

Pelaku jasa pendampingan / joki skripsi (freelance maupun tim kecil) saat ini umumnya beroperasi dengan tooling _ad-hoc_:

- **Spreadsheet** (Google Sheets / Excel) untuk daftar klien dan termin pembayaran.
- **WhatsApp** untuk koordinasi & update progres ke klien.
- **Google Drive / Cloud Storage manual** untuk arsip draf bab.
- **Catatan pribadi** (Notion / kertas) untuk pelacakan revisi dosen.

Masalah yang ditimbulkan:

1. **Data tersebar** — sulit melihat status semua klien dalam 1 tampilan.
2. **Risiko hilang konteks** — chat WhatsApp lama susah dicari saat butuh rekap progres.
3. **Tidak ada audit trail** — sulit mengetahui kapan draf bab terakhir diserahkan ke dosen.
4. **Pencatatan keuangan rawan keliru** — DP, termin per bab, pelunasan sering tidak ter-rekonsiliasi.
5. **Tidak ada visibility untuk klien** — klien bertanya berulang via chat karena tidak ada cara mandiri melihat progres.

## 2. Visi Produk

> _"Sebuah ruang kerja terpusat untuk pelaku jasa pendampingan skripsi yang menggantikan kombinasi spreadsheet + WhatsApp + Drive — terjangkau, ringan, dan tumbuh bersama bisnis dari 1 klien sampai 100+ klien."_

## 3. Persona Pengguna

### 3.1 Persona Utama — "Joki Solo / Founder"
- **Profil:** Mahasiswa tingkat akhir / fresh graduate yang menjalankan jasa skripsi sebagai side-income atau bisnis utama.
- **Tingkat teknis:** Familiar dengan tools modern (Google Workspace, Notion). Bukan developer.
- **Kebutuhan utama:** Tracking multi-klien, kalkulasi otomatis sisa termin, arsip dokumen aman.
- **Frustasi:** Sering lupa deadline revisi dosen, sulit jelaskan progres ke klien yang menagih.

### 3.2 Persona Sekunder — "Asisten / Co-worker"
- **Profil:** Anggota tim yang dipekerjakan ad-hoc untuk mengerjakan bab tertentu.
- **Kebutuhan:** Lihat task yang di-assign ke dirinya, upload draf, update status.
- **Out of scope MVP** (di-assign manual via field text, akun terpisah di fase 2).

### 3.3 Persona Tersier — "Klien Mahasiswa"
- **Profil:** Pemesan jasa skripsi.
- **Kebutuhan:** Tahu progres bab, kapan harus bayar termin, akses draf.
- **Out of scope MVP** (interaksi via WhatsApp dulu, client portal di fase 3).

## 4. Goals & Non-Goals MVP

### 4.1 Goals (In-Scope MVP)
- [G1] Admin bisa login aman dan satu-satunya yang akses sistem.
- [G2] CRUD penuh untuk: Klien, Proyek Skripsi, Task, Pembayaran, File.
- [G3] Visualisasi Kanban per proyek skripsi (kolom: Backlog, Pengerjaan, Revisi Dosen, ACC). Selain kanban board juga visualisasi list dengan kemampuan bisa menambahkan column.
- [G4] Dashboard ringkasan: jumlah klien aktif, deadline terdekat, total piutang.
- [G5] Upload & download dokumen draf bab via Supabase Storage.
- [G6] Pencatatan keuangan: tagihan, pembayaran masuk, kalkulasi sisa otomatis.
- [G7] Catatan karakteristik dosen pembimbing per klien (field free-text + tag).
- [G8] Mobile-responsive (admin sering akses dari HP saat bimbingan).
- [G9] **Extensibility — custom field per entitas** (klien, proyek, task, pembayaran, dosen). Admin dapat menambah kolom data sendiri (text/number/select/date/dll) tanpa migrasi schema. Detail di [`12-custom-fields-extensibility.md`](./12-custom-fields-extensibility.md).

### 4.2 Non-Goals MVP (Eksplisit Tidak Dikerjakan)
- [N1] Multi-tenant / multi-organisasi.
- [N2] Client-facing portal.
- [N3] Payment gateway otomatis (Midtrans/Xendit) — pencatatan manual dulu.
- [N4] Notifikasi WhatsApp otomatis.
- [N5] Mobile app native.
- [N6] AI-assisted writing / plagiarism checker.
- [N7] Time tracking jam kerja.
- [N8] Invoicing PDF auto-generate (manual via export sederhana).

## 5. Lingkup Fitur MVP

Detail spek per fitur ada di [`04-feature-specifications.md`](./04-feature-specifications.md). Ringkasan modul:

| Modul | Deskripsi singkat | Prioritas |
|-------|-------------------|-----------|
| **M1 — Auth & Profil** | Login email/password + magic link, profil admin | P0 |
| **M2 — Manajemen Klien** | CRUD klien + data akademis (kampus, jurusan, dosbing, sidang) | P0 |
| **M3 — Manajemen Proyek Skripsi** | CRUD proyek, 1 klien bisa multi-proyek (skripsi, ditambah revisi) | P0 |
| **M4 — Kanban Task** | Drag-drop task antar kolom status, atau dropdown (lihat 04) | P0 |
| **M5 — Pencatatan Pembayaran** | Termin, DP, pelunasan, kalkulasi sisa | P0 |
| **M6 — File & Asset** | Upload draf bab, referensi, bukti transfer | P0 |
| **M7 — Dashboard** | KPI cards + chart finansial + deadline timeline | P0 |
| **M8 — Pencarian & Filter** | Search klien & proyek, filter status, sort deadline | P1 |
| **M9 — Notifikasi In-app** | Reminder deadline H-7 / H-3 (browser notif optional) | P1 |
| **M10 — Audit log** | History perubahan status proyek & pembayaran | P2 |
| **M11 — Custom Fields** | Tambah kolom data sendiri per entitas (ala Jira/ClickUp). Detail: [`12-custom-fields-extensibility.md`](./12-custom-fields-extensibility.md) | P0 |

## 6. User Journey Inti (Happy Path)

### 6.1 Journey: Onboarding Klien Baru
1. Admin login → klik "Tambah Klien" di sidebar.
2. Isi form: nama, kontak (HP/WA/email), kampus, jurusan, dosen pembimbing 1 & 2 (opsional), tanggal target sidang, catatan karakteristik dosbing (free text).
3. Submit → sistem buat record klien.
4. Admin diarahkan ke halaman detail klien → klik "Buat Proyek Skripsi".
5. Isi: judul skripsi, total nilai kontrak, breakdown termin (default: 3 termin 30/40/30), jumlah bab (default 5).
6. Submit → sistem auto-generate task default per bab (Bab 1 s/d 5 + Sidang).

### 6.2 Journey: Update Progres Harian
1. Admin buka dashboard → lihat "Deadline Mendekat" → klik salah satu.
2. Masuk ke board Kanban proyek.
3. Drag task "Bab 2 — Draf" dari kolom **Pengerjaan** ke **Revisi Dosen**.
4. Modal muncul: input tanggal kirim, catatan revisi dari dosbing (jika ada).
5. Submit → status terupdate, audit log tercatat.

### 6.3 Journey: Pembayaran Masuk
1. Klien transfer DP via WhatsApp → kirim bukti transfer.
2. Admin buka detail proyek → tab "Keuangan".
3. Klik "Catat Pembayaran" → isi: nominal, tanggal, metode (BCA/Mandiri/QRIS/Dana), upload bukti transfer.
4. Submit → saldo terbayar bertambah, sisa piutang berkurang, status termin ter-update otomatis.

## 7. Non-Functional Requirements

| Kategori | Requirement |
|----------|-------------|
| **Performance** | Halaman utama LCP < 2.5s di koneksi 4G. Server Component first-paint < 1s. |
| **Availability** | Mengikuti SLA Vercel + Supabase (uptime ~99.9%). |
| **Security** | Semua endpoint protected oleh Supabase Auth + RLS. HTTPS only. CSRF via SameSite cookie. |
| **Data residency** | Supabase region: **Singapore (ap-southeast-1)** untuk latensi optimal Indonesia. |
| **Backup** | Supabase auto-backup harian (free tier: 7 hari retention). Manual SQL dump mingguan. |
| **Browser support** | Chrome/Edge/Firefox/Safari 2 versi terakhir. Mobile Safari iOS 15+. |
| **Aksesibilitas** | WCAG 2.1 AA minimum: kontras teks, fokus indicator, keyboard navigation. |
| **i18n** | Bahasa Indonesia. English siap di-toggle di fase 2 (i18n keys sudah disiapkan). |

## 8. Asumsi & Batasan

- **Asumsi 1:** Admin tunggal untuk MVP. Multi-admin = fase 2.
- **Asumsi 2:** Volume klien aktif < 50 secara bersamaan → cukup di free tier Supabase.
- **Asumsi 3:** Total file < 1 GB untuk 6 bulan pertama → cukup di Supabase Storage free tier.
- **Asumsi 4:** Tidak ada integrasi pihak ketiga (kampus, perpus, dll) di MVP.
- **Batasan:** Tidak ada SLA enterprise. Free tier Supabase pause project jika tidak diakses 7 hari → workaround: cron ping (dijelaskan di `08-deployment-devops.md`).

## 9. Metrik Keberhasilan (Success Metrics)

| Metrik | Target 3 bulan |
|--------|----------------|
| Jumlah klien yang dikelola di sistem | ≥ 10 |
| Frekuensi login admin / minggu | ≥ 5x |
| Pengurangan waktu rekap status (vs spreadsheet) | ≥ 50% |
| File draf tersimpan di sistem (vs Drive manual) | ≥ 80% |
| Akurasi pencatatan keuangan (selisih 0 vs rekening) | 100% |

## 10. Risiko & Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|--------------|--------|----------|
| Free tier Supabase paused / kena limit | Medium | High | Cron ping mingguan + monitor kuota; siap upgrade Pro ($25/bln) jika klien > 30 |
| Data leak (klien minta privasi) | Low | High | RLS strict; data klien dienkripsi at-rest oleh Supabase; backup terenkripsi |
| Scope creep (fitur tak henti) | High | Medium | Strict non-goals di MVP; backlog terpisah untuk fase 2 |
| Lock-in vendor (Supabase) | Low | Medium | Schema postgres standar; bisa self-host Supabase atau pindah ke Neon/Postgres lain |
| Adopsi gagal (admin tetap pakai sheet) | Medium | High | UX ringan, import CSV awal dari spreadsheet existing, mobile-friendly |

## 11. Dependencies & Open Questions

### Dependencies eksternal
- Akun Supabase aktif (free).
- Akun Vercel terhubung GitHub (free).
- Domain custom (opsional, ~Rp 150rb/thn untuk `.com` atau gratis `.vercel.app`).

### Open Questions (perlu putusan owner sebelum coding)
1. Apakah nama brand final? **Bimbingo**.
2. Domain custom dipakai langsung atau pakai subdomain Vercel dulu?
3. Apakah sistem perlu menyimpan KTP / data pribadi sensitif klien? **Rekomendasi: tidak**.
4. Tampilan default Kanban atau List view? **Rekomendasi: List view default, Kanban opsional toggle.**

---

**Status approval:**
- [x] Owner approve scope MVP
- [x] Owner approve non-goals
- [x] Owner pilih nama brand final
- [x] Owner setujui residency Singapore
